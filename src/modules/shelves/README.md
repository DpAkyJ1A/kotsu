# shelves

Shelves and the items on them: create, rename, move, reorder and delete; the sidebar.

Shelves so far live only in the domain: `listShelves` gives the user's shelves in their order; `createShelf` adds one at
the end, in the palette colour the user's shelves use least when none is given; `updateShelf` renames and recolours;
`moveShelf` puts a shelf after another one (and after any shelf sharing its key), or first; `deleteShelf` removes it. Another user's shelf, on either side of
a move, answers `NOT_FOUND`, as a missing one does. The order is a fractional key (`fractional-indexing`) compared byte by
byte, so a move rewrites one row; two shelves that end up with the same key keep their creation order.

- **Writes:** `shelf`; `item` except its body (`content`, `plain_text`, `version`).
- **Depends on:** no other module.
