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
`hasRoomForBody` (the doc save adds it to its `update … where`, so it only fits a statement on `item`) and
`ITEM_ROW_BYTES` (the docs tests count with it), `actions.ts` makes a Server Action
of each shelf and item command, `loaders.ts` gives pages `loadNavigation` and `loadStorage`, and
`index.ts` gives the app layout `ShelvesProvider`, `ShelfNav` (the sidebar's tree) and the folded-shelves cookie
(`COLLAPSED_SHELVES_COOKIE`, `collapsedShelvesFrom`) and `StorageUsage` (Settings → Storage), the pages `ShelvesScreen` (the
Shelves tab), `ShelfHeading`, `ShelfScreen` (a shelf's docs), `DocBreadcrumb` (a doc page's header) and `docPath`, and other modules
`ShelfDot` and `DocTitle` (the doc editor's title).
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
Reordering is `@dnd-kit/react`, set up once for every list (`hooks/drag-setup.ts`): rows and tiles follow the mouse
after 5 px and a finger after a 250 ms press, nothing starts on a button or a field, and each one has a move handle that
shows on keyboard focus, with the moves spoken in the interface language. A shelf's page reads the
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

In the sidebar each shelf lists its docs under its row (`ShelfTree` → `ShelfBranch` → `DocRow`). Every shelf starts
open, its docs one step in along a thin line that falls from the shelf's dot. On hover or keyboard focus the dot of a
shelf with docs turns into an arrow that folds it away (on a touch screen the arrow stays), and the folded ones live in a cookie of shelf ids that the app layout reads, so the tree
comes from the server already folded; only shelves that still exist are written. A shelf opens itself when a doc is
made on it or dropped on it. A row's buttons (the move handle, + and ⋯) lie over its right end and show on hover and
keyboard focus, when the name moves its ellipsis in front of them; until then the name has the whole row. The + in a
shelf's row opens the same create form as the + tile (`NewDoc`); after the doc is created the focus stays
on its page instead of going back to the +. Docs drag in the same provider as the shelves (`useDocDragging`): over
another doc the list shows where the doc will land (`moveOverDoc` in `core/doc-drag.ts`; on another shelf it goes before
that doc from above and after it from below), dropped on a shelf's row it goes to the end of that shelf
(`moveOntoShelf`), and nothing is sent when it lands where it was (`changesPlace`). The spoken moves name the shelf and
come from the same moves as the preview and the drop, so what is said is where the doc goes. A
double-click on a doc's title renames it in place, as a shelf's name does there, and deleting the doc whose page is open
leaves for its shelf's page. On a shelf's page the tiles reorder within their grid (`useTileDragging`, the arrow keys on
the move handle); to another shelf a doc goes through ⋯ → Move to or the sidebar. The `/shelves` list stays flat.

A doc's page shows where it is: "Spanish › Verbs" at the top (`DocBreadcrumb`, the shelf a link to its page), on a phone
only the back arrow to the shelf, "Back to Spanish" to a screen reader. Its title is a field above the text (`DocTitle`, a `textarea` inside the page's `h1`
that grows with the title): it saves once the typing pauses for 800 ms (`useTitleDraft`), and a title still waiting
goes at once when the field is left or the page closes, always through `rename`, so the sidebar, the tiles and the line
at the top change at once; Enter (but not the one that ends a word typed with an input method), or ↓ at its end, goes
on to the text; left empty, it puts back the title it had, which it shows as its placeholder meanwhile; pasted line
breaks become spaces (`core/title-draft.ts`). Both read the doc and its shelf from the same lists, so a rename or a
move made in the sidebar shows there too; while the field is being typed in it keeps the typed text, and once it is
left a rename made elsewhere after its last save stands. Renames go one at a time: Next.js sends a Server Action only
after the one before it has answered, so a slow first save can't land after a later one.

`useItems()` gives the views `items` (what they show), `existing` (the same with the docs waiting for Undo),
`createDoc(shelfId, title)` (creates, opens, and resolves to whether it worked), `rename(id, title)`,
`move(id, shelfId, after)` (`undefined` for `after` puts it first) and `delete(item)` (the item, not its id: the toast names
it).

Storage: every item counts the size of its body (`size_bytes`, which `docs` writes on save) and 1 kB for itself
(`ITEM_ROW_BYTES` in `core/storage.ts`), so a thousand empty docs aren't free; nothing else keeps a total that could
drift. `domain/storage.ts` has the one count (`bytesOf`, `usedBytes`) and `hasRoomForBody`, the condition `docs` adds to
its save: the body shrinks or stays, or the user's total with the new body fits in the quota. `createItem` refuses
an item whose 1 kB doesn't fit (`STORAGE_FULL`). The quota is the user's own (`user_settings.storage_quota_bytes`)
or the server's default (`STORAGE_QUOTA_MB`), and none on a server that sets neither (`src/server/storage-quota.ts`).
`getStorage` (`loadStorage`) gives the total, the quota, and the five largest shelves and docs; `StorageUsage` draws
them in Settings → Storage: a half-circle meter («32 MB of 50 MB»), calm below 80 %, amber «Running low» from 80 %,
red «Almost full» from 95 % and «Full» at the quota, or just «12 MB used» without a quota; sizes in kB, MB and GB of
a thousand. Two saves at once can each pass the check and go a little over: the quota is soft by one save.

- **Writes:** `shelf`; `item` except its body (`content`, `plain_text`, `version`, `size_bytes`).
- **Depends on:** no other module.
