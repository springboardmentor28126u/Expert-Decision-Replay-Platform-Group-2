from ai_service import summarize_decision

summary = summarize_decision(
    problem_statement="Our team spends too much time in manual code reviews, slowing down releases.",
    discussion_text="Discussed switching to an automated linting tool. Some concerns about false positives. Decided to pilot ESLint for 2 weeks before full rollout."
)
print(summary)