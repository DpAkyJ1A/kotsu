# shelves

Shelves and the items on them: create, rename, move, reorder and delete; the sidebar.

The domain: `getNavigation` gives the user's shelves in their order and, as a flat list beside them, the docs and sheets
on them, each with its shelf and in its shelf's order (two queries at once); `createShelf` adds one at the end, under
the id the browser made for it if it sent one (a uuid v7), in the palette colour the user's shelves use least when none
is given; `updateShelf` renames and recolours; `moveShelf` puts a shelf after another one (and after any shelf sharing
its key), or first; `deleteShelf` removes it. Another user's shelf, on either side of a move, answers `NOT_FOUND`, as a
missing one does. The order is a fractional key (`fractional-indexing`) compared byte by byte, so a move rewrites one
row; two shelves that end up with the same key keep their creation order.

Items follow the same rules on their shelf: `createItem` adds a doc or a sheet at the end of its shelf, empty (no body,
version 1), under the id the browser made if it sent one; `renameItem` changes only the title; `moveItem` puts an item
after another one on the shelf it names, or first there, which is how it moves between shelves too; `deleteItem`
removes it, and deleting a shelf removes its items. Renaming and moving leave `version` alone: it counts saves of the
body, so a rename never conflicts with an open editor. Another user's shelf or item, or an item to go after that sits
on another shelf, answers `NOT_FOUND`.

The doors: `api.ts` gives other modules' domain code `createShelf` (onboarding makes a template's shelves with it),
`actions.ts` makes a Server Action of each shelf command (the item commands get theirs with the shelf screen),
`loaders.ts` gives pages `loadNavigation`, and `index.ts` gives the app layout `ShelvesProvider` and `ShelfNav` (the
sidebar's list), the pages `ShelvesScreen` (the Shelves tab) and `ShelfHeading`, and other modules `ShelfDot`.
`ShelvesProvider` holds the list every view shows: changes appear at once (`useOptimistic` over `applyShelfChange` from
`core/`) and the page is rendered again when the action answers; a refused one puts the list back and says why in a
toast. Delete hides the shelf and waits five seconds for Undo before it sends anything, and leaves the shelf's page if
it was open. A double-click on a name renames it in place, the caret where the click was. Reordering is
`@dnd-kit/react`: rows follow the mouse after 5 px and a finger after a 250 ms press, and each row has a move handle
that shows on keyboard focus, with the moves spoken in the interface language. A shelf's page reads the same list, so a
renamed shelf's title changes with the sidebar.

- **Writes:** `shelf`; `item` except its body (`content`, `plain_text`, `version`, `size_bytes`).
- **Depends on:** no other module.
