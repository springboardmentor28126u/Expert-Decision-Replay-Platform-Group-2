import { AxiosError } from 'axios';

export const extractErrorMessage = (error: unknown, fallbackMessage = 'An unexpected error occurred'): string => {
  if (!error) return fallbackMessage;
  if (typeof error === 'string') return error;
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    }
    if (error.response?.data?.message) return error.response.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallbackMessage;
};
