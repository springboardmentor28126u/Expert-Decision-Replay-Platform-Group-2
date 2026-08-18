import React, { useEffect, useState } from 'react';
import { authApi } from '../../api/auth';
import Input from './Input';

interface CaptchaWidgetProps {
  captchaId: string;
  captchaAnswer: string;
  onChange: (captchaId: string, captchaAnswer: string) => void;
  error?: string;
}

const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  captchaId,
  captchaAnswer,
  onChange,
  error,
}) => {
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');

  const fetchCaptcha = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await authApi.getCaptcha();
      setCaptchaImage(res.captcha_image);
      onChange(res.captcha_id, '');
    } catch (err: any) {
      setFetchError('Failed to load CAPTCHA challenge');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!captchaId) {
      fetchCaptcha();
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-2.5">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none flex items-center justify-between">
        <span>Security Verification (CAPTCHA)</span>
        <span className="text-[10px] text-text-muted lowercase tracking-normal font-normal">(case sensitive)</span>
      </label>

      <div className="flex items-center gap-3">
        {/* CAPTCHA Display Area */}
        <div className="relative flex items-center justify-center rounded-lg border border-border/80 bg-surface-elevated p-1 shadow-inner h-[50px] min-w-[170px]">
          {loading ? (
            <div className="flex items-center justify-center w-[170px] h-[50px] text-xs text-text-muted">
              Loading CAPTCHA...
            </div>
          ) : fetchError ? (
            <div className="text-xs text-error font-medium p-1 text-center">{fetchError}</div>
          ) : (
            <img
              src={captchaImage}
              alt="CAPTCHA Challenge"
              className="h-[46px] w-[166px] rounded select-none object-contain"
            />
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={fetchCaptcha}
          disabled={loading}
          className="p-2.5 rounded-lg border border-border/80 hover:bg-surface-elevated/80 text-text-secondary hover:text-text transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Refresh CAPTCHA"
          aria-label="Refresh CAPTCHA"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Answer Input Field */}
      <Input
        placeholder="Enter CAPTCHA code"
        value={captchaAnswer}
        onChange={(e) => onChange(captchaId, e.target.value)}
        error={error}
        required
        autoComplete="off"
      />
    </div>
  );
};

export default CaptchaWidget;
