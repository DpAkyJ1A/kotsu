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
`actions.ts` makes a Server Action of each shelf and item command, `loaders.ts` gives pages `loadNavigation`, and
`index.ts` gives the app layout `ShelvesProvider` and `ShelfNav` (the sidebar's list), the pages `ShelvesScreen` (the
Shelves tab), `ShelfHeading`, `ShelfScreen` (a shelf's docs) and `shelfPath`, and other modules `ShelfDot`.
`ShelvesProvider` holds the two lists every view shows, shelves and items, each with its own reducer from `core/`
(`applyShelfChange`, `applyItemChange`): changes appear at once (`useOptimistic`) and the page is rendered again when
the action answers; a refused one puts the list back and says why in a toast. Delete hides a shelf or a doc and waits
five seconds for Undo before it sends anything, and deleting a shelf leaves its page, or the page of one of its docs,
if it was open. A shelf with docs asks first, in one window that lists them and keeps its Delete button off until the
shelf's name is typed; an empty one goes at once. Whether a shelf has docs is read from all the docs that still exist,
so one waiting for its own Undo counts. A double-click on a name renames it in place, the caret where the click was
(`useRenaming`, which doc tiles use too). In the sidebar that is a plain double-click: the first click opens the shelf
and the sidebar stays. On the Shelves page the first click would leave the list, so a click on a name there waits 300 ms
for a second one, as a doc's title does (below).
Reordering is `@dnd-kit/react`: rows follow the mouse after 5 px and a finger after a 250 ms press, and each row has a
move handle that shows on keyboard focus, with the moves spoken in the interface language. A shelf's page reads the
same list, so a renamed shelf's title changes with the sidebar.

A shelf's page shows a dashed + tile first, captioned only on an empty shelf, and then its docs as tiles (the items of
that shelf from the same list). The + opens a popover, a bottom drawer below the `md` breakpoint, with the title field focused;
the typed title is kept above that switch, so turning a phone or resizing a window keeps it. Creating is the one change
that waits for the server: Enter sends the doc under an id made in the browser, the form stays busy until the answer,
and then `/docs/[itemId]` opens; so every tile is a doc the server already has, and nothing done to it can arrive
before its insert. A tile's ⋯ menu renames the doc in place, moves it to the end of another shelf (the shelves are
listed in the menu itself, so it works the same with a finger and the keyboard) or deletes it; when the doc leaves the
page, the focus goes to the + tile. A move goes after the last doc the list shows on that shelf: the browser sends
Server Actions one at a time, so every earlier change has reached the server before it does. A double-click on a
tile's title renames the doc in place, like a shelf's name; since the tile is a link that leaves the page, a click on
its title waits 300 ms for a second one before the doc opens (`useOpenUnlessDoubleClicked`). A click anywhere else on the tile, Enter and a ⌘-click open at once, and touch
screens (whose ⋯ buttons are always shown) never wait.

`useItems()` gives the views `items` (what they show), `existing` (the same with the docs waiting for Undo),
`createDoc(shelfId, title)` (creates, opens, and resolves to whether it worked), `rename(id, title)`,
`move(id, shelfId, after)` (`undefined` for `after` puts it first) and `delete(item)` (the item, not its id: the toast names
it).

- **Writes:** `shelf`; `item` except its body (`content`, `plain_text`, `version`, `size_bytes`).
- **Depends on:** no other module.
