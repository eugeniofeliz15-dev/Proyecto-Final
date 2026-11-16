import axios from 'axios';

interface ApiErrorBody {
  message?: unknown;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) {
      const messages = message.filter(
        (item): item is string => typeof item === 'string',
      );
      if (messages.length > 0) return messages.join(', ');
    }
  }

  if (error instanceof Error) return error.message;
  return fallback;
}
