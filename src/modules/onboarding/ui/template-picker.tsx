'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type SubmitEvent, useId, useState } from 'react';

import { Button } from '@/ui/button';
import { RadioCard, RadioCards } from '@/ui/radio-cards';

import { TEMPLATE_IDS, type TemplateId } from '../core/template';
import { templatesIn } from '../core/templates';
import { useCompleteOnboarding } from '../hooks/use-complete-onboarding';
import { TemplatePreview } from './template-preview';

export function TemplatePicker() {
  const t = useTranslations();
  const templates = templatesIn(useLocale());
  const [picked, setPicked] = useState<TemplateId | null>(null);
  const shelvesId = useId();
  const { complete, failure, isPending } = useCompleteOnboarding();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (picked) complete(picked);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">
      <RadioCards
        aria-label={t('onboarding.title')}
        value={picked ?? ''}
        onValueChange={(value) => {
          setPicked(TEMPLATE_IDS.find((id) => id === value) ?? null);
        }}
        disabled={isPending}
        className="grid-flow-row grid-cols-2 gap-x-4 gap-y-6 **:data-[slot=radio-card-picture]:aspect-auto **:data-[slot=radio-card-picture]:h-28 md:grid-cols-4"
      >
        {TEMPLATE_IDS.map((id) => (
          <RadioCard
            key={id}
            value={id}
            aria-describedby={`${shelvesId}-${id}`}
            picture={
              <TemplatePreview
                id={`${shelvesId}-${id}`}
                shelves={templates[id].shelves}
              />
            }
          >
            {t(`onboarding.templates.${id}`)}
          </RadioCard>
        ))}
      </RadioCards>
      {failure && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${failure}`)}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={!picked || isPending}
        className="justify-self-end max-md:justify-self-stretch"
      >
        {t('onboarding.continue')}
      </Button>
    </form>
  );
}
