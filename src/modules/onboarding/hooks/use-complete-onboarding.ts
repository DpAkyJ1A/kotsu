import type { Messages } from 'next-intl';
import { useState, useTransition } from 'react';

import { runAction } from '@/lib/run-action';

import { completeOnboardingAction } from '../actions';
import type { TemplateId } from '../core/template';

export function useCompleteOnboarding() {
  const [failure, setFailure] = useState<keyof Messages['errors'] | null>(null);
  const [isPending, startTransition] = useTransition();

  function complete(templateId: TemplateId) {
    startTransition(async () => {
      const failed = await runAction(completeOnboardingAction, {
        templateId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setFailure(failed);
    });
  }

  return { complete, failure, isPending };
}
