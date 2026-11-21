export function idBefore(
  list: readonly { id: string }[],
  movedId: string,
  newIndex: number,
) {
  const others = list.filter((entry) => entry.id !== movedId);
  return others[newIndex - 1]?.id;
}
