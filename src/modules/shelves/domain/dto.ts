import 'server-only';

import { item, shelf } from '@/server/db/schema/shelves';

export const shelfDto = {
  id: shelf.id,
  name: shelf.name,
  color: shelf.color,
};

export const itemDto = {
  id: item.id,
  shelfId: item.shelfId,
  kind: item.kind,
  title: item.title,
};
