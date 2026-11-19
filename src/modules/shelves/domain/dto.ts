import 'server-only';

import { shelf } from '@/server/db/schema/shelves';

export const shelfDto = {
  id: shelf.id,
  name: shelf.name,
  color: shelf.color,
};
