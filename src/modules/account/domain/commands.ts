import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';

import { userSettings } from '@/server/db/schema/settings';
import { command } from '@/server/domain';

import { MarkOnboardedInput, UpdateSettingsInput } from '../core/settings';
import { toSettingsDto } from './dto';

export const updateSettings = command(
  UpdateSettingsInput,
  async (ctx, patch) => {
    const [settings] = await ctx.db
      .update(userSettings)
      .set(patch)
      .where(eq(userSettings.userId, ctx.userId))
      .returning();
    if (!settings) throw new Error(`No settings for user ${ctx.userId}`);
    return toSettingsDto(settings);
  },
);

export const markOnboarded = command(
  MarkOnboardedInput,
  async (ctx, { timezone }) => {
    const marked = await ctx.db
      .update(userSettings)
      .set({ timezone, onboardedAt: ctx.now })
      .where(
        and(
          eq(userSettings.userId, ctx.userId),
          isNull(userSettings.onboardedAt),
        ),
      )
      .returning({ userId: userSettings.userId });
    return marked.length > 0;
  },
);
