import 'server-only';

import { eq } from 'drizzle-orm';

import { userSettings } from '@/server/db/schema/settings';
import { command } from '@/server/domain';

import { UpdateSettingsInput } from '../core/settings';
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
