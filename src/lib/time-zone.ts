import { z } from 'zod';

export const TimeZone = z
  .string()
  .max(64)
  .regex(/^[A-Za-z]/)
  .refine(isTimeZone);

function isTimeZone(name: string) {
  try {
    Intl.DateTimeFormat('en', { timeZone: name });
    return true;
  } catch {
    return false;
  }
}
