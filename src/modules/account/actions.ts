'use server';

import { cookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

import { defineAction } from '@/server/actions';

import { PASSKEY_OFFER_COOKIE } from './core/passkey-offer-cookie';
import type { SettingsPatch } from './core/settings';
import { settingsCookies } from './core/settings-cookies';
import { toNextPath } from './core/sign-in-paths';
import { updateSettings } from './domain/commands';

export async function answerPasskeyOffer(next: string) {
  (await cookies()).set(PASSKEY_OFFER_COOKIE);
  redirect(toNextPath(next), RedirectType.replace);
}

export const updateSettingsAction = defineAction(
  async (ctx, patch: SettingsPatch) => {
    const settings = await updateSettings(ctx, patch);
    const cookieStore = await cookies();
    for (const cookie of settingsCookies(settings)) cookieStore.set(cookie);
    return settings;
  },
);
