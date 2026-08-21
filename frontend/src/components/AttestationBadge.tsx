import { useState } from 'react';
import { IconShieldCheck, IconShieldOff, IconLoader2 } from '@tabler/icons-react';
import { approvalService, SignatureVerification } from '../services/approvalService';

interface AttestationBadgeProps {
  decisionId: string;
  approvalId: string;
  signatureHash: string | null;
  attestedAt: string | null;
}

export function AttestationBadge({
  decisionId,
  approvalId,
  signatureHash,
  attestedAt,
}: AttestationBadgeProps) {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<SignatureVerification | null>(null);

  if (!signatureHash) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
        <IconShieldOff size={14} />
        Not attested
      </span>
    );
  }

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await approvalService.verifySignature(decisionId, approvalId);
      setResult(res);
    } catch {
      setResult({ verified: false, reason: 'Verification request failed', approval_id: approvalId });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <span
      className="inline-flex items-center gap-1 cursor-pointer group"
      onClick={handleVerify}
      title="Click to verify signature"
    >
      {verifying ? (
        <IconLoader2 size={14} className="animate-spin text-indigo-500" />
      ) : result?.verified === true ? (
        <IconShieldCheck size={14} className="text-green-500" />
      ) : result?.verified === false ? (
        <IconShieldOff size={14} className="text-red-500" />
      ) : (
        <IconShieldCheck size={14} className="text-green-500" />
      )}
      <span className={`text-xs font-medium ${
        result?.verified === false
          ? 'text-red-600 dark:text-red-400'
          : 'text-green-600 dark:text-green-400'
      }`}>
        {result?.verified === false
          ? 'Invalid'
          : result?.verified === true
            ? 'Verified'
            : 'Attested'
        }
      </span>
      {attestedAt && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(attestedAt).toLocaleDateString()}
        </span>
      )}
    </span>
  );
}
