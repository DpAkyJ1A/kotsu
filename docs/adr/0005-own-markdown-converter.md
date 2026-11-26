# 0005. A Markdown converter of our own, on marked's lexer

- Date: 2026-11-26
- Status: Accepted

## Context

A doc is ProseMirror JSON. MCP tools, export, templates and the card index (which keeps a card's answer as Markdown)
need it as Markdown and back, on the server, without a DOM, and a round trip must change nothing: colours, cards,
empty lines, text that looks like Markdown.

Options considered:

- **`@tiptap/markdown` 3.34**: runs in Node, but in a test of eleven blocks it dropped colours, wrote a card as
  `:::details` and split its question into three paragraphs, broke the fence of a code block that held backticks, and
  read a list numbered with letters back as starting at 100. Each would need its own spec or workaround, inside a
  library whose output we don't control.
- **remark (mdast)**: precise, but a tree of many packages and plugins for what `marked` does in one.
- **markdown-it**: what the plan expected Tiptap to bring along; it doesn't, so it would be a new dependency like any
  other, with no gain over `marked`.

## Decision

- Doc → Markdown is a walk over the JSON in `docs/core/markdown/`: blocks, then marks with delimiters where
  CommonMark's flanking rules allow them and HTML tags where they don't; each line is read back once to be sure.
- Markdown → doc reads the tokens of `marked`'s lexer (GitHub flavour, bare-address links off) and builds the JSON;
  cards are gathered from `<details>` HTML.
- Block ids are not written; reading gives every block a new one.

## Consequences

- Every rule of the format sits in a few small files and is pinned by example tests and property tests (fast-check).
- An update of `marked` can change how something reads; the property tests are the check.
- A card exported and read back is a new card: its practice history stays with the old one.
