import 'server-only';

import { markOnboarded } from '@/modules/account/api';
import { createShelf } from '@/modules/shelves/api';
import { command } from '@/server/domain';

import { CompleteOnboardingInput } from '../core/onboarding';
import { templatesIn } from '../core/templates';

export const completeOnboarding = command.tx(
  CompleteOnboardingInput,
  async (ctx, { templateId, timezone }) => {
    const marked = await markOnboarded(ctx, { timezone });
    if (!marked) return;

    const template = templatesIn(ctx.settings.locale)[templateId];
    for (const name of template.shelves) await createShelf(ctx, { name });
  },
);
