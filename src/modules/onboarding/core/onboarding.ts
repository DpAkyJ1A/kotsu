import { z } from 'zod';

import { TimeZone } from '@/lib/time-zone';

import { TEMPLATE_IDS } from './template';

export const CompleteOnboardingInput = z.strictObject({
  templateId: z.enum(TEMPLATE_IDS),
  timezone: TimeZone.catch('UTC'),
});
