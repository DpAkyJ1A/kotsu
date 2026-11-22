# docs

The doc editor, autosave, and conversion between docs and Markdown.

A doc's body is ProseMirror JSON in `item.content`, edited with Tiptap. `DocKit` (`core/doc-kit.ts`) is the one list of
what a doc may hold, and the editor and the server build their schema from it alike (`getSchema([DocKit])` runs in Node
without a DOM): paragraphs, headings 1 to 3, bulleted, numbered and checklist lists (checklist items nest like the
others), quotes, code blocks, lines and line breaks; bold, italic, strike and code. Underline (Markdown has no way to
write it) and the starter kit's link (Kotsu's own links come later) are left out. Every paragraph, heading, list and
checklist item, quote and code block carries a `blockId`, a uuid set by Tiptap's UniqueID, so a link can point at a
place in a doc and a card keeps its identity: Enter keeps the id with the text that stays, and a pasted copy gets a new
one, so no two blocks in a doc share an id.

What the schema check leaves to the save (`Node.fromJSON` and `check()` refuse unknown nodes and marks and a block in
the wrong place, but not these): an attribute it doesn't know is dropped rather than refused, so the body to store is
the parsed doc, not the JSON that came in; attribute values aren't checked (a heading level 7 passes); and the root may
be any node, so the save checks it is a `doc`.

The domain: `getDoc({ id })` gives a doc's body and `version`, or `null` for a doc that was never saved; another user's
item, a missing one and a sheet answer `NOT_FOUND`, and an id that isn't a uuid `VALIDATION`.

The doors: `loaders.ts` gives the doc page `loadDoc`, which turns `NOT_FOUND` and `VALIDATION` into the not-found page,
and `index.ts` gives it `DocEditor`: the title from `shelves` (`DocTitle`) above the body in a column; `DocEditor` draws
both, since only it holds the editor that Enter in the title moves to. The page keys it by the doc's id, so another doc
always gets a new editor. A new doc (no body yet) opens with the caret in its text, except on a touch screen
(`pointer: coarse`), where a phone would show the keyboard only for a tap; the price is that an iPad with a trackpad or
a touch laptop whose main pointer is the screen also opens without the caret. A doc with text leaves the focus where it
was. The editable area reaches down to the bottom of the page (the shell's `main` is a flex column, so the page can fill
it), so a tap under the text lands in it: the browser itself opens the keyboard and places the caret (at the end of the
text in Chromium and WebKit). ProseMirror ignores the mouse events that follow a touch, so `handleClick` in
`useDocEditor` is for the mouse: a click under the last block puts the caret at the end at once, even when it brings the
focus back from the title (Chrome would first put it at the start). Scrolling keeps 96 px under the caret, so a phone's
tab bar never covers it.

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
scrolls when there is little room); it goes with the editor when the doc closes.

What a pick does (`core/insert-block.ts`): on a line that holds only the query, the line becomes the block; on a line
with text, the query goes and the block opens below the whole line, with the caret in it, as Enter would open a line
there (in a list, a new item). A block that isn't the line's list or quote takes the line out of its lists and quotes,
which part around it, as far as they can part without breaking a list; choosing the list or quote the line is already in
keeps it there. A new list under a list of its kind joins it, as `- ` does; a divider always leaves a new line under it
for the caret. A pick is an undo step of its own, so ⌘Z right after it brings the typed `/h2` back as text (and with it
the menu; after a query with a space, such as `/heading 2`, the text comes back without the menu, since a space doesn't
open it). Adding a block to the menu takes four entries: its keywords in `SLASH_BLOCKS`, what it does in
`TURN_PLAIN_LINE_INTO`, its icon and its label and description in `messages`.

The body isn't saved yet (task 1.5).

- **Writes:** the body of doc items: `item.content`, `item.plain_text`, `item.version`, `item.size_bytes`.
- **Depends on:** `shelves`, `cards`.
