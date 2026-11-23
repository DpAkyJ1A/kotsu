import 'server-only';

import { env } from './env';
import type { UserSettings } from './settings';

const BYTES_IN_A_MEGABYTE = 1_000_000;

export function storageQuotaOf({
  storageQuotaBytes,
}: Pick<UserSettings, 'storageQuotaBytes'>) {
  if (storageQuotaBytes !== null) return storageQuotaBytes;
  if (env.STORAGE_QUOTA_MB === undefined) return null;
  return env.STORAGE_QUOTA_MB * BYTES_IN_A_MEGABYTE;
}
