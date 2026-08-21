"""
Expert Decision Replay Platform - Approval Routing Service

Evaluates conditional rules to modify approval chains based on decision attributes.
"""

import logging
from decimal import Decimal, InvalidOperation
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.decision import Decision, ImpactLevel
from app.models.approval_routing_rule import ApprovalRoutingRule, Operator, InsertPosition

logger = logging.getLogger("expert_decision")


class ApprovalRoutingService:
    """Service for evaluating and applying approval routing rules."""

    @staticmethod
    def evaluate_condition(decision: Decision, rule: ApprovalRoutingRule) -> bool:
        """
        Evaluate a single rule condition against a decision.
        
        Returns True if the condition matches, False otherwise.
        Null field values never match (rules that reference them are skipped).
        """
        # Get the field value from decision
        field_value = getattr(decision, rule.condition_field, None)
        if field_value is None:
            return False

        try:
            # Cast condition_value based on field type
            if rule.condition_field == "financial_impact":
                compare_value = Decimal(rule.condition_value)
                field_value = Decimal(str(field_value))
            elif rule.condition_field == "risk_score":
                compare_value = int(rule.condition_value)
                field_value = int(field_value)
            elif rule.condition_field == "impact_level":
                # String comparison for enum values
                compare_value = rule.condition_value.lower()
                field_value = field_value.value.lower() if hasattr(field_value, 'value') else field_value.lower()
            else:
                # Default: string comparison
                compare_value = rule.condition_value
                field_value = str(field_value)

            # Apply operator
            if rule.operator == Operator.GT:
                return field_value > compare_value
            elif rule.operator == Operator.GTE:
                return field_value >= compare_value
            elif rule.operator == Operator.LT:
                return field_value < compare_value
            elif rule.operator == Operator.LTE:
                return field_value <= compare_value
            elif rule.operator == Operator.EQ:
                return field_value == compare_value
            elif rule.operator == Operator.IN:
                # Comma-separated list
                options = [v.strip().lower() for v in rule.condition_value.split(",")]
                return str(field_value).lower() in options
            else:
                return False
        except (InvalidOperation, ValueError, TypeError) as e:
            logger.warning(f"Failed to evaluate rule {rule.id}: {e}")
            return False

    @staticmethod
    def resolve_approval_chain(
        db: Session,
        decision: Decision,
        base_levels: List[dict],
        category_name: str,
    ) -> List[dict]:
        """
        Resolve the final approval chain by applying routing rules.
        
        1. Start with base_levels from ApprovalChainConfig
        2. Fetch active rules for company_id + category
        3. Evaluate each rule in priority order
        4. Apply matching rules (append or insert)
        5. Return the final resolved level list
        """
        # Fetch active rules for this company and category
        rules = (
            db.query(ApprovalRoutingRule)
            .filter(
                ApprovalRoutingRule.company_id == decision.company_id,
                ApprovalRoutingRule.category == category_name,
                ApprovalRoutingRule.active == True,
            )
            .order_by(ApprovalRoutingRule.priority, ApprovalRoutingRule.created_at)
            .all()
        )

        if not rules:
            return base_levels

        resolved = list(base_levels)  # copy
        applied_rules = []

        for rule in rules:
            if ApprovalRoutingService.evaluate_condition(decision, rule):
                applied_rules.append(rule)
                
                if rule.insert_position == InsertPosition.APPEND:
                    # Append to the end
                    new_level = len(resolved) + 1
                    resolved.append({
                        "level": new_level,
                        "role": rule.inserted_role,
                        "source": "routing_rule",
                        "rule_id": str(rule.id),
                    })
                elif rule.insert_position == InsertPosition.INSERT_BEFORE:
                    # Insert before a specific level
                    target_level = rule.insert_before_level or 1
                    insert_idx = None
                    for i, lvl in enumerate(resolved):
                        if lvl.get("level") == target_level:
                            insert_idx = i
                            break
                    
                    if insert_idx is not None:
                        # Shift existing levels
                        for i in range(insert_idx, len(resolved)):
                            resolved[i]["level"] = resolved[i].get("level", i + 1) + 1
                        
                        resolved.insert(insert_idx, {
                            "level": target_level,
                            "role": rule.inserted_role,
                            "source": "routing_rule",
                            "rule_id": str(rule.id),
                        })
                    else:
                        # Target level not found, append instead
                        new_level = len(resolved) + 1
                        resolved.append({
                            "level": new_level,
                            "role": rule.inserted_role,
                            "source": "routing_rule",
                            "rule_id": str(rule.id),
                        })

        if applied_rules:
            logger.info(
                f"Applied {len(applied_rules)} routing rules to decision {decision.id}: "
                f"base chain extended from {len(base_levels)} to {len(resolved)} levels"
            )

        return resolved

    @staticmethod
    def preview_routing(
        db: Session,
        company_id: UUID,
        category_name: str,
        decision_fields: dict,
    ) -> dict:
        """
        Preview which routing rules would apply for given decision fields.
        Used by the frontend to show warnings before submission.
        """
        rules = (
            db.query(ApprovalRoutingRule)
            .filter(
                ApprovalRoutingRule.company_id == company_id,
                ApprovalRoutingRule.category == category_name,
                ApprovalRoutingRule.active == True,
            )
            .order_by(ApprovalRoutingRule.priority)
            .all()
        )

        matching_rules = []
        for rule in rules:
            # Create a temporary decision-like object for evaluation
            field_value = decision_fields.get(rule.condition_field)
            if field_value is None:
                continue
            
            # Check if condition matches
            try:
                if rule.condition_field == "financial_impact":
                    compare_value = Decimal(rule.condition_value)
                    field_value = Decimal(str(field_value))
                elif rule.condition_field == "risk_score":
                    compare_value = int(rule.condition_value)
                    field_value = int(field_value)
                elif rule.condition_field == "impact_level":
                    compare_value = rule.condition_value.lower()
                    field_value = str(field_value).lower()
                else:
                    compare_value = rule.condition_value
                    field_value = str(field_value)

                matched = False
                if rule.operator == Operator.GT:
                    matched = field_value > compare_value
                elif rule.operator == Operator.GTE:
                    matched = field_value >= compare_value
                elif rule.operator == Operator.LT:
                    matched = field_value < compare_value
                elif rule.operator == Operator.LTE:
                    matched = field_value <= compare_value
                elif rule.operator == Operator.EQ:
                    matched = field_value == compare_value
                elif rule.operator == Operator.IN:
                    options = [v.strip().lower() for v in rule.condition_value.split(",")]
                    matched = str(field_value).lower() in options

                if matched:
                    matching_rules.append({
                        "rule_id": str(rule.id),
                        "condition_field": rule.condition_field,
                        "operator": rule.operator.value,
                        "condition_value": rule.condition_value,
                        "inserted_role": rule.inserted_role,
                        "insert_position": rule.insert_position.value,
                    })
            except (InvalidOperation, ValueError, TypeError):
                continue

        return {
            "matching_rules": matching_rules,
            "additional_approvals_needed": len(matching_rules),
        }
