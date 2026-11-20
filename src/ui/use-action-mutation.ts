import { type Messages, useTranslations } from 'next-intl';

import { type Action, runAction } from '@/lib/run-action';

import { toast } from './toast';

type ErrorCode = keyof Messages['errors'];

export function useActionMutation<Input>(action: Action<Input, ErrorCode>) {
  const t = useTranslations('errors');

  return async function run(input: Input) {
    const failure = await runAction(action, input);
    if (failure) toast.error(t(failure));
    return failure === null;
  };
}
