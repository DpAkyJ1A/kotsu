# docs

The doc editor, autosave, and conversion between docs and Markdown.

A doc's body is ProseMirror JSON in `item.content`, edited with Tiptap. `DocKit` (`core/doc-kit.ts`) is the one list of
what a doc may hold, and the editor and the server build their schema from it alike (`getSchema([DocKit])` runs in Node
without a DOM): paragraphs, headings 1 to 3, bulleted, numbered and checklist lists (checklist items nest like the
others), quotes, code blocks, lines, line breaks and cards (below); bold, italic, strike, code and colour. Underline (Markdown has no way to
write it) and the starter kit's link (Kotsu's own links come later) are left out. Every paragraph, heading, list and
checklist item, quote, code block and card carries a `blockId`, a uuid set by Tiptap's UniqueID, so a link can point at a
place in a doc and a card keeps its identity: Enter keeps the id with the text that stays, and no two blocks in a doc
share an id. A paste keeps the ids the doc doesn't have yet and drops the others (`core/block-ids.ts`, which replaces
UniqueID's own paste rule of dropping every id), so a block cut and pasted back, or dragged to another place, is the
same block, and a copy pasted into the same doc is a new one.

A body to save goes through `DocBody` (`core/doc-body.ts`), which adds what the schema check leaves out
(`Node.fromJSON` and `check()` refuse unknown nodes and marks and a block in the wrong place, but not these): an
attribute it doesn't know is dropped rather than refused, so what is stored is the parsed doc's `toJSON()`, not the JSON
that came in; attribute values, of nodes and of marks alike, are checked against a list of their own (a heading level
7, a `blockId` that isn't a uuid, a checked state that isn't a boolean or a colour outside the palette are refused); and
the root must be a `doc`.

The domain: `getDoc({ id })` gives a doc's body, `version` and `sizeBytes`, or `null` for a doc that was never saved; another user's
item, a missing one and a sheet answer `NOT_FOUND`, and an id that isn't a uuid `VALIDATION`. `saveDoc({ id, version,
content })` stores a body only on top of the version it was based on: one `update … where version = $v returning
version` writes the body, its text for search (`core/plain-text.ts`: each block on a line of its own, so the words of
two blocks never run together), its size in bytes and `version + 1`, and answers the new version. A doc's body is at
most 500 KB of JSON (`LARGEST_DOC_BYTES` in `core/save-limits.ts`); a longer one answers `LIMIT` before anything is
written. The cap sits below what Postgres's search index holds (a `tsvector` over 1 MB fails with error 54000 at
about 640 KB of words that all differ), so a doc at the cap stays searchable even with no word repeated; 54000 still
answers `LIMIT` rather than failing the request. The same `update` checks the user's storage quota
(`hasRoomForBody` from `shelves`): a body that grows past it changes nothing. No row back then means `NOT_FOUND`
when the doc is missing, a sheet or another user's (`domain/own-doc.ts`), `CONFLICT` when its version moved on, and
otherwise `STORAGE_FULL`.

The doors: `loaders.ts` gives the doc page `loadDoc`, which turns `NOT_FOUND` and `VALIDATION` into the not-found page;
`actions.ts` gives the editor `saveDocAction`; `routes.ts` gives `src/app/api/docs/save` the save a closing tab sends
(below); and `index.ts` gives Settings → Storage `DocCeiling` (below) and the page `DocEditor`: the doc bar (below: `DocBreadcrumb` from `shelves`, drawn from the
doc and shelf the page passes in, the formatting toolbar, the save status and the outline), then the title from `shelves`
(`DocTitle`) above the body in a column; `DocEditor` draws both, since only it holds the editor that Enter in the title
moves to. The page passes data, not a ready breadcrumb element: on a large doc React streams such an element in lazily,
and in a list of siblings the dev build then warns about a missing `key`. The page keys it by the doc's id, so another
doc always gets a new editor. A new doc (no body yet) opens with the caret in its text, except on a touch screen
(`pointer: coarse`), where a phone would show the keyboard only for a tap; the price is that an iPad with a trackpad or
a touch laptop whose main pointer is the screen also opens without the caret. A doc with text leaves the focus where it
was. The editable area reaches down to the bottom of the page (the shell's `main` is a flex column, so the page can fill
it), so a tap under the text lands in it: the browser itself opens the keyboard and places the caret (at the end of the
text in Chromium and WebKit). ProseMirror ignores the mouse events that follow a touch, so `handleClick` in
`useDocEditor` is for the mouse: a click under the last block puts the caret at the end at once, even when it brings the
focus back from the title (Chrome would first put it at the start). Scrolling keeps 96 px under the caret, so a phone's
tab bar never covers it, and over it 112 px from the `md` breakpoint up, where the doc bar sits at its tallest, and 64
px on a phone, whose bar scrolls away.

An empty doc says how to start, with `/` or Markdown (to a screen reader too, as the body's `aria-placeholder`), with
no-break spaces that keep «# heading» on one line (WebKit breaks them in editable text unless `-webkit-nbsp-mode` is
`normal`, which `doc-editor.tsx` sets on the hint) and a word joiner between the «-» of «- list» and its no-break space
(browsers may break after a hyphen even before a no-break space). In a doc with text, the empty line with the caret says
"Type / for blocks" until the first letter (a word being composed takes it away at its first letter too), but only while
the text has the focus and nothing is selected, and only on a plain line at the top: a paragraph, not a list item, a
quote, a heading or code. It is for the eye only (the `::before` has an empty alternative text, as the doc's hint does),
and it goes with the focus, so a doc being read shows nothing on the empty line Tiptap keeps at its end after a heading,
a list or code. Both hints are Tiptap's Placeholder, which marks only the top-level block with the caret: its text is
the doc's hint while the doc is empty and the line's otherwise, and `showsAHint` in `useDocEditor` gives it the class
`shows-hint`, which `doc-editor.tsx` draws, only when it should show: always in an empty doc, everything selected or
not, and on a line as above.

Markdown shortcuts turn into blocks and marks as you type, and Enter (or ↓ at the end) in the title goes on to the start
of the text. The editor renders on the client only (`immediatelyRender: false`), so the server sends the page with the
title and an empty body, and the ids of a doc saved without them are set once it opens. A language picked while a doc is
open reaches the editor without making a new one, so the text, the caret and the undo history stay: the body's name and
`aria-placeholder` come with Tiptap's own option refresh on each render, while both hints and the name of an empty
checklist item read the words from a small cell in `useDocEditor`, which a switch updates before it redraws the editor's
views (`createNodeViews`).

The slash menu (`ui/slash-menu.ts`, an extension on Tiptap's suggestion utility) opens at `/` typed at the start of a
line or after a space, but not inside a word (`and/or`), in a code block or in inline code; the title is a field of its
own and has none. The focus stays in the text: what is typed after `/` narrows the blocks (`core/slash-blocks.ts`: each
word of the query starts a word of a term, in order and each a word of its own, and a query of one word may also start
the term without its spaces, `/heading2`; the terms are the label in the user's language and English keywords, some of
them two words, so `/h2`, `/heading 2` and `/bul list` work in Russian too, as do `/заг 2` and `/мар спи`), ↑ ↓ move the
highlight round the list, Enter or a click picks, and Escape closes the menu and leaves the typed text alone; Tab and
Shift+Tab close it the same way and then do their own job (nest or lift a list item). A list that matches nothing says
so (to a screen reader too, as a status), and Enter then starts a new line. A query may hold spaces, as in Notion, but a
space never opens the menu: it only keeps an open one open, and only while the query still finds a block
(`isSlashMenuOpen`, which the suggestion utility's `allow` asks on every transaction with whether the menu was open). So
`/ ` and `/xyz ` close it and stay text, typing on or Backspace doesn't open it again, and neither does a caret put at
the end of an old `/heading 2`; after Escape the suggestion utility itself keeps it closed for that `/`. Two edges: a
caret put inside the first word (`/head|ing 2`) makes a query without a space and opens the menu, as in an old `/h2` (a
pick then replaces only the text up to the caret); and a menu already open at another `/` moves to an old `/heading 2`
clicked at its end, since `allow` knows only whether the menu was open, not where. To know what a query finds, the
extension reads the labels through the translator, which `useDocEditor` keeps in a cell of its own: a language switch
updates it without a new editor and without redrawing anything. The list (`ui/slash-menu-list.tsx`) is a listbox the
body points at with `aria-controls` and `aria-activedescendant`, mounted by the suggestion utility next to the typed `/`
and kept inside the window by Floating UI (it flips above near the bottom, slides in from the edge on a phone and
scrolls when there is little room); it goes with the editor when the doc closes. Floating UI first measures the menu
before its list is drawn, as an empty box at the end of the page, so the menu takes the room left
(`--available-height`) only once it has a height (or it would stay squeezed under a caret near the bottom), and the
highlighted block scrolls into view within the list only (`container: 'nearest'`; or opening the menu in a long doc
would throw the page to its end).

What a pick does (`core/insert-block.ts`): on a line that holds only the query, the line becomes the block; on a line
with text, the query goes and the block opens below the whole line, with the caret in it, as Enter would open a line
there (in a list, a new item). A block that isn't the line's list or quote takes the line out of its lists and quotes,
which part around it, as far as they can part without breaking a list; choosing the list or quote the line is already in
keeps it there. A new list under a list of its kind joins it, as `- ` does; a divider always leaves a new line under it
for the caret. A pick is an undo step of its own, so ⌘Z right after it brings the typed `/h2` back as text (and with it
the menu; after a query with a space, such as `/heading 2`, the text comes back without the menu, since a space doesn't
open it). The menu offers only the blocks that can go where the caret is (`core/blocks-at.ts`, asked of the schema):
in a card's answer, text, the three lists and code; in a card's question, nothing, so it doesn't open there. The card
comes first, on a violet tile, since it is the block docs are for. Adding a
block to the menu takes five entries: its keywords in `SLASH_BLOCKS`, its node in `NODE_OF`, what it does in
`TURN_PLAIN_LINE_INTO`, its icon and its label and description in `messages`.

The doc bar (`ui/doc-bar.tsx`) holds where the doc is, the formatting toolbar and the save status, over the title. From
the `md` breakpoint up it sticks to the top of the window, so the save status is always in sight; its bottom edge shows
only once the page scrolls under it (`border-b-on-scroll` in `src/ui/theme.css`, a scroll timeline over the first pixel,
so the edge takes its pixel from the start and nothing moves). Its layout follows the width of the page, not of the
window (a container query on `DocEditor`, which fills the shell's `main`), since the sidebar narrows the page without
changing the window: from 72rem (`@6xl`) it is one row of three columns, the breadcrumb on the left (both names ending
in an ellipsis when the row is short), the toolbar in the middle right over the text, and the status on the right; on a
narrower page it is two rows of one bar, the breadcrumb and the status, then the toolbar. The layout is the same from
the top of the page down, so scrolling never moves anything. The caret keeps 112 px from the top of the window
(`ROOM_UNDER_THE_DOC_BAR_PX` in `useDocEditor`), the bar's height at two rows with some air, one number for both layouts, so it never hides under the
bar. The bar's parts go in the order they are read on a wide page, the place, the toolbar, the status; on a narrower
page the grid puts the status up beside the place. On a phone the bar is the plain page header and scrolls away with the
text.

The outline (`ui/doc-outline.tsx`) lists the doc's headings beside the text and says which one you are reading.
`core/outline.ts` reads them from the doc: every heading with text, in lists and quotes too, with a line break read as a
space, each indented by its level below the highest level in the doc (a doc of `##` and `###` starts at the margin), and
with the position the editor finds it at. `useDocOutline` follows the doc through
`useEditorState` (a new outline only for a new doc, not for a caret move). `useCurrentHeading`, mounted only while the
doc has headings (so a doc that gets them back starts with none current), takes the last heading whose top is at or
above the reading line, the same 112 px under the window's top the caret keeps, so the heading the bar just covered
still counts; above the first heading none is current. It reads once a frame at most, when the page scrolls (the window
scrolls the doc; a list or a code block scrolling inside it doesn't count), the window resizes, or the text changes
height (a `ResizeObserver` on the editor, so an edit that pushes a heading past the line counts, and typing within a
line costs nothing); it subscribes once per editor. A click on a heading scrolls to it (at once with reduced motion) and
puts the caret at its start, but not on a touch screen, where it would open the keyboard; the clicked heading stays
current until the next wheel, touch, key or pointer press, since a heading near the end of the doc can't scroll up to
the line. The outline hangs from the doc bar: it is the bar's last child, placed right under it in the right margin
(`absolute top-full`), so it sticks with the bar and needs no height of its own, and the save status's popover covers
it while open. From `@6xl` the right margin is a third of the bar and the outline is a plain list there; on a narrower
page it is a column of dashes under the status, one per heading, longer for a higher level, the current one dark, and a
hover or a focus inside (Tab reaches the list, which is in the DOM all along) opens the list as a panel over the
margin. Both are as tall as the window allows; a longer outline scrolls inside itself and keeps the current heading
and its dash in view (`showTheCurrentInside`, which scrolls the list, never the page). Below `@3xl` the page has no margin for it and it is hidden, and on a phone (narrower than `md`) it isn't drawn
at all, so it runs no listeners. Every element in the body keeps `scroll-margin-top: 112px` from `md` up
(`md:**:scroll-mt-[112px]` on the article, in px like `ROOM_UNDER_THE_DOC_BAR_PX`, so a larger browser font moves
neither), so a heading scrolled to, a checkbox or a link reached with Tab, or the title
never land under the bar (WCAG 2.4.11). That is margin on the targets, not `scroll-padding-top` on the page: padding on
the page also moves focus inside the bar itself, and a Tab to a toolbar button would scroll the page. The outline is
built here rather than with `@tiptap/extension-table-of-contents`, which writes ids into the doc in transactions (a doc
would save itself on open), measures `offsetTop` with no reading line and reads the layout on every scroll event.

The formatting toolbar (`ui/doc-toolbar.tsx`) is in the doc bar from the `md` breakpoint up (a phone, with its tab bar,
has none): headings 1 to 3 | bold, italic, strike, inline code | colour and the last colour (below) | the three lists |
quote, code block, divider | and last, set apart, the card: a violet button with its label (only the icon while the
column is narrower than the `3xl` container size). The blocks have the slash menu's icons and labels (`ui/format-icons.ts`, `docs.slashMenu`; the marks have theirs in
`docs.toolbar`). A button acts on the text, never on the title: a click keeps the focus where it is (the button takes no
`mousedown`), and from the title or from the keyboard the button first gives the text the focus back at its old caret.
Each toggle runs the command its Tiptap shortcut runs (`core/apply-format.ts`), so a button and its shortcut always
agree, and a second press undoes it: a block turns back into a paragraph, a list item leaves its list. The divider
isn't a toggle: it goes under the line with a new line under it for the caret, through the slash menu's `insertBlock`.
The card isn't either: it makes a card of the line or of the selected blocks (below). A button lights up (`aria-pressed`) while the caret is in
its format, and turns off (disabled, not hidden) where its toggle can't run or its block can't go: no mark in a code
block, no other mark in inline code, no quote in a list item, only marks in a card's question, and in its answer no
heading, quote, divider or card. The buttons sit 1 px apart and the separators 2 px from them, so the row, card
included, still fits the column of a page beside the sidebar at 768 px. Whether it can run is
asked by running it on a command manager over the current state, which leaves the doc alone, and not with
`editor.can()`: that says no to a heading or a code block in a list item and to a list on a heading or in code, although
their shortcuts do them (its dry run skips the step that first takes the line out of its list). The toolbar is an ARIA
toolbar (Radix, through `src/ui/toolbar.tsx`): one Tab stop, and the arrows, Home and End move along it, past the
buttons that are off. A button's tooltip says its name, its shortcut and its Markdown: "Heading 2 ⌘⌥2 ##", "Bold ⌘B
**text**", "Divider ---" (Ctrl instead of ⌘ away from Apple devices, read from the browser only once a tooltip opens, so
the page from the server never depends on it). The shortcuts and the Markdown are one list, `SHORTCUTS` in
`core/formats.ts`, free of Tiptap, for a Shortcuts section in Settings later; browser tests press every shortcut and
type every Markdown of the list and check that the button lights up, so the list can't drift from Tiptap's keymaps.

Text takes a colour and a background (`core/text-colour.ts`): Tiptap's `TextStyle`, `Color` and `BackgroundColor`
from `@tiptap/extension-text-style`, so both live in one `textStyle` mark with `color` and `backgroundColor`, each the
name of one of the nine colours of the doc palette (`core/colours.ts`: gray, brown, orange, yellow, green, blue,
purple, pink and red, as in Notion, apart from the shelves' palette), never a hex value. The doc keeps the name, and
the page draws it with classes, `<span data-color="blue" data-bg="yellow" class="text-ink-blue bg-marker-yellow">`,
never an inline style, so each colour has its own value in the light and the dark theme (`--ink-*` and `--marker-*` in
`src/ui/theme.css`; `theme.test.ts` keeps every ink at 4.5:1 on the page, on a popover and on every marker, and
ordinary text at 4.5:1 on every marker, in both themes). The same `<span>` is what a copy carries and what a paste
reads, so text pasted from another Kotsu doc keeps its colours; from anywhere else (a colour in a `style`, as Google
Docs and websites write it, or a name outside the palette) it comes in plain. The extension's own parsing and drawing
(inline styles) are replaced; its commands are kept. A code block and inline code take no colour.

In the toolbar, after the marks, «A» opens a popover (`ui/text-colours.tsx`) with two rows of swatches, text colours
then backgrounds, each with Default first, which takes that colour off. Each row is a `SwatchGroup`: one Tab stop, the
arrows move along it (Tab goes to the other row), Enter or a click picks, and the colours under the caret (or at the
start of the selection) are checked; a click on the checked swatch still paints the whole selection, which may hold
other colours. A pick paints the text at once and the popover stays open, so text and background go in one go; Escape,
a click outside or a second click on «A» closes it, and the text gets the focus back with its selection, unless the
click put the focus somewhere else. The button beside «A» paints the selection with the last colour, as does ⌘⇧H
(Ctrl+Shift+H; the `lastColour` entry of `SHORTCUTS`): what was picked in the last opening of the popover, text,
background or both (Default is not a colour, so it never changes it), and red text before the first pick. It shows
that colour on its «A», and its name and tooltip say it ("Last colour: blue text, yellow background ⌘⇧H"). The last
colour is kept on the device (`localStorage`, `hooks/use-last-colour.ts`, read again by the shortcut on every press
and shared between tabs); where storage is blocked it stays red text. There are no colours in the slash menu: colour
goes on selected text, where the menu doesn't open.

A card (`core/card.ts`) is a question with an answer folded away under it, the block practice will draw from.
It is Tiptap's Details (`@tiptap/extension-details`): a `details` node holding a `detailsSummary` (the question, plain
text with marks) and a `detailsContent` (the answer: paragraphs, the three lists and code blocks, no headings, quotes,
dividers or cards). The names stay Tiptap's, since its keyboard handling looks the parts up by them, and they match the
`<details><summary>` the Markdown converter will write (1.7); `core/card-parts.ts` names them for the rest of the code.
Details' own view, its open attribute and two of its keys are replaced:

- **Open or folded** is not in the doc, so opening a card is never an edit and never saves. `core/open-cards.ts` keeps
  the open cards in a plugin's state (a node decoration per open card, mapped through every edit) and gives every
  folded card's answer the `hidden` attribute (a card pasted into a list inside an answer too), which hides it with or without a stylesheet; Details' caret handling
  reads that from the page. Every doc opens with its cards folded.
- **The view** (`ui/card-view.tsx`, a React node view redrawn whenever its decorations change, since Tiptap's skips a
  redraw when only they do): the arrow (a button with a tooltip, «Show answer ⌘⇧↵» / «Hide answer», and
  `aria-expanded`), the card icon, the question with a «Question» hint while it is empty, and the status chip. The
  arrow toggles the card and leaves the caret where it was.
- **The keys** (`core/card-commands.ts`): Enter in the question opens the card and moves the caret to the start of the
  answer, adding nothing; Enter on the empty last line of an answer that has more leaves the
  card for the line under it (Details' own check never matches, because UniqueID gives that line an id);
  ⌘⇧Enter (`SHORTCUTS.card`) folds or opens the card around the caret, and a fold with the caret or the
  selection reaching into the answer takes the caret to the end of the question; outside a card it makes one, as the
  Card button does. Details' Backspace at the start of the question stays: it turns the card
  back into lines.
- **Making one** (`core/make-card.ts`), with the Card button, ⌘⇧Enter or `/card`: the caret's line, or a selection
  inside it, becomes the question, the caret at its end (a line break turns into a space). A selection over several
  blocks becomes one card: the first block is its question if it is a line (a paragraph or a heading), and the rest its
  answer, which the card opens on; what an answer can't hold turns into what it can (a heading into a paragraph, a
  quote into its lines, a divider goes), and empty lines at the ends are left out. A caret in a list, a quote or code
  gets an empty card under its line, as `/card` does; a selection that holds a card, or only
  dividers and empty lines, makes none. One ⌘Z brings the
  lines back. `??` and a space at the start of a line (`SHORTCUTS.card.markdown`) turn the line into a card too.
- **The status chip** shows New, Review or Got it from a map of `blockId → status` that `CardStatusesContext`
  (`ui/card-statuses.ts`) hands down; until the card index (task 1.8) fills it, every card is New.

The body saves itself (`hooks/save-queue.ts`, `hooks/use-doc-saving.ts`). Every edit restarts an 800 ms timer, and
the save goes when it runs out, with the version the doc was opened at or last saved at. Only typing counts as an
edit: a transaction that changes the doc and is not kept out of the undo history (`core/user-edit.ts`). So UniqueID
giving the blocks of an old doc their ids as it opens saves nothing, and neither does a newer version put in from the
server. One save is on its way at a time; edits made meanwhile go in the next one, sent as soon as the answer comes,
from the version it returned. The right of the doc bar says where things are (`ui/doc-save-status.tsx`), quiet while
all is well and loud when it isn't: a grey dot that pulses while a save is due or on its way (it stands still with
reduced motion), a muted check once saved (green for a moment after a save from this tab, `animate-just-done`), and a red «!»
with a word beside it when a save failed: «Offline», «Doc full», «Storage full», «Not saved». Each state has its own
shape, so colour is never the only sign; the words for a screen reader stay in the `role="status"` («Saving…»,
«Saved» are visually hidden). Which mark and whether the doc is filling up is `saveIndicatorOf` (`core/save-indicator.ts`):
from 80 % of the 500 KB a thin bar beside the mark shows how full the doc is, from 90 % it turns amber and «Doc almost
full» stands beside it, and over 100 % it is red. Under 80 % there is no bar, or an ordinary doc would show 0.5 % for
years. The size is the save's own: the queue measures the body it is about to send (`JSON.stringify`, which it does
anyway, so not on every key), and a doc opens with the `size_bytes` `getDoc` gives; a newer version from the server
brings its size along. So while a save waits (offline) or failed, the size is that of the body that wasn't saved, not
of the copy the server keeps. A body over 500 KB is not sent at all (the queue answers itself `TOO_LONG`, and `LIMIT` from the
server reads the same), and saves again as soon as it is short enough. The status is a button: a hover (after 200 ms,
leaving the focus where it was), a click, a tap or Enter opens a popover with the doc's details (`ui/doc-details.tsx`):
the state in words and what to do about it, the size against the cap with its bar (over the cap rounded up, so it never
reads «500 kB of 500 kB» beside «Doc full»), words and characters (`textCountsOf` in `core/text-counts.ts`, one walk
over the text, counted again only when the doc changes, not when the caret moves: characters as the eye counts them,
so an accent or an emoji is one, code points in a browser without `Intl.Segmenter`, and words split on any space, so
lines of code count apart), when this tab last saved («2 minutes ago»,
kept fresh while it is open; nothing before the first save), and the cap in words, «One doc holds up to 500 kB, about
100–350 thousand characters» (`DocCeiling`, which Settings → Storage shows too, through a slot in `StorageUsage`, since
`shelves` can't import `docs`). The popover never says how many characters are left: the cap is bytes of JSON, and
the same 500 KB is 100 to 350 thousand characters depending on the language and the length of the lines. Hover opens
it unpinned (`hooks/use-open-on-hover.ts`: it closes when the pointer leaves both, after 200 ms, and Escape closes it
without moving the focus); a click or Enter while it is open pins it and moves the focus into it, as opening it that
way does, and then it closes like any popover, on Escape (the focus goes back to the button), a click outside or a
second click. With «Storage full» a
banner over the doc says its changes aren't saved and links to Settings → Storage (`ui/storage-full-banner.tsx`), and
the popover has the same link; the link the page hands in opens the Settings window over the doc, so the unsaved text
stays. A save that failed, found the
browser offline or found the storage full is tried again with the next edit, and when the tab comes back into view or
back online.

A save from the open page is a Server Action, so the page and the router's cache of pages already seen are refreshed
after it; it is handed a `structuredClone` of the body, since ProseMirror's attributes are objects without a
prototype, which React can't send to an action. A tab that is hidden or closed (`visibilitychange` to hidden,
`pagehide`) saves at once with `fetch` and `keepalive`, which outlives the page, to `POST /api/docs/save`: the route
takes only requests the browser marks `Sec-Fetch-Site: same-origin` (anything else gets 403) with a `Content-Length`
of at most 64 KB (413, `LIMIT`, otherwise) and answers as the action does (`answer()` in `src/server/actions.ts`,
without the refresh, which a route handler can't do). A keepalive body can't pass 64 KB, so a longer doc saves through
the action as the tab hides. The «Leave page?» question comes only
when that can't save the edits: the browser is offline, the last save failed or met a conflict, a save is still on its
way with newer edits behind it, or the doc is over 64 KB.

A tab that comes back into view, or back online, with nothing unsaved asks the server for the doc (`router.refresh()`),
and a newer version replaces the text silently, outside the undo history (⌘Z doesn't bring the old text back). With
unsaved edits it leaves the server's doc alone, and its next save meets `CONFLICT`: a dialog (`ui/conflict-dialog.tsx`,
an `alertdialog`) asks what to keep. «Reload» takes the server's version; «Keep mine», the primary, fetches it only for
its version and saves this tab's text over it. Escape or a click outside puts the choice off: the status says «Not
saved», no save goes, the tab asks before it closes, and the next edit asks again. The dialog itself takes the focus,
not a button, so keys typed on as it opens choose nothing. Edges left: a doc left for another page of the app while
offline loses its last edits (no page is left to retry them); a Server Action save still on its way as the tab
closes, with nothing typed after it, is left to the browser, which may cut it off; a save the server took whose answer
was lost is sent again from the old version and meets a `CONFLICT` with itself; and a doc deleted in another tab
says «Not saved» and tries again with every edit.

- **Writes:** the body of doc items: `item.content`, `item.plain_text`, `item.version`, `item.size_bytes`.
- **Depends on:** `shelves`, `cards`.
