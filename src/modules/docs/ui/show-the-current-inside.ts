export function showTheCurrentInside(list: HTMLElement | null) {
  const current = list?.querySelector('[data-current]');
  if (!list || !current) return;
  const room = list.getBoundingClientRect();
  const item = current.getBoundingClientRect();
  if (item.top < room.top) list.scrollTop -= room.top - item.top;
  else if (item.bottom > room.bottom)
    list.scrollTop += item.bottom - room.bottom;
}
