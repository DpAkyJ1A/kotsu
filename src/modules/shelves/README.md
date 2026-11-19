# shelves

Shelves and the items on them: create, rename, move, reorder and delete; the sidebar.

The domain: `listShelves` gives the user's shelves in their order; `createShelf` adds one at the end, under the id the
browser made for it if it sent one (a uuid v7), in the palette colour the user's shelves use least when none is given;
`updateShelf` renames and recolours; `moveShelf` puts a shelf after another one (and after any shelf sharing its key), or
first; `deleteShelf` removes it. Another user's shelf, on either side of a move, answers `NOT_FOUND`, as a missing one
does. The order is a fractional key (`fractional-indexing`) compared byte by byte, so a move rewrites one row; two
shelves that end up with the same key keep their creation order.

The doors: `api.ts` gives other modules' domain code `createShelf` (onboarding makes a template's shelves with it),
`actions.ts` makes a Server Action of each command, `loaders.ts` gives pages `loadShelves`, and `index.ts` gives the app
layout `ShelvesProvider` and `ShelfNav` (the sidebar's list), the pages `ShelvesScreen` (the Shelves tab) and
`ShelfHeading`, and other modules `ShelfDot`. `ShelvesProvider` holds the list every view shows: changes appear at once
(`useOptimistic` over `applyShelfChange` from `core/`) and the page is rendered again when the action answers; a refused
one puts the list back and says why in a toast. Delete hides the shelf and waits five seconds for Undo before it sends
anything, and leaves the shelf's page if it was open. A double-click on a name renames it in place, the caret where the
click was. Reordering is `@dnd-kit/react`: rows follow the mouse after 5 px and a finger after a 250 ms press, and each
row has a move handle that shows on keyboard focus, with the moves spoken in the interface language. A shelf's page
reads the same list, so a renamed shelf's title changes with the sidebar.

- **Writes:** `shelf`; `item` except its body (`content`, `plain_text`, `version`).
- **Depends on:** no other module.
