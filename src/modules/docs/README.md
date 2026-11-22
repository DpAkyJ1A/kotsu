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
(`pointer: coarse`), where a phone would show the keyboard only for a tap; the price is that an iPad with a trackpad or a
touch laptop whose main pointer is the screen also opens without the caret. A doc with text leaves the focus where it
was. The editable area reaches down to the bottom of the page (the shell's `main` is a flex column, so the page can fill
it), so a tap under the text lands in it: the browser itself opens the keyboard and places the caret (at the end of
the text in Chromium and WebKit).
ProseMirror ignores the mouse events that follow a touch, so `handleClick` in `useDocEditor` is for the mouse: a click
under the last block puts the caret at the end at once, even when it brings the focus back from the title (Chrome
would first put it at the start). Scrolling keeps 96 px under the caret, so a phone's tab bar never covers it. An empty doc shows how to start (to a screen reader, as the body's `aria-placeholder`), with
no-break spaces that keep «# heading» on one line (WebKit breaks them in editable text unless `-webkit-nbsp-mode` is
`normal`, which `doc-editor.tsx` sets on the hint), Markdown shortcuts turn into blocks and marks as you type, and Enter (or ↓ at the end) in the title goes on to the start
of the text. The editor renders on the client only (`immediatelyRender: false`), so the server sends the page with the
title and an empty body, and the ids of a doc saved without them are set once it opens. A language picked while a doc
is open reaches the editor without making a new one, so the text, the caret and the undo history stay: the body's name
and `aria-placeholder` come with Tiptap's own option refresh on each render, while the hint and the name of an empty
checklist item read the words from a small cell in `useDocEditor`, which a switch updates before it redraws the
editor's views (`createNodeViews`).

The body isn't saved yet (task 1.5).

- **Writes:** the body of doc items: `item.content`, `item.plain_text`, `item.version`, `item.size_bytes`.
- **Depends on:** `shelves`, `cards`.
