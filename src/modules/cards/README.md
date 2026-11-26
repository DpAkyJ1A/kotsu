# cards

The card index: question-and-answer cards found in docs, their statuses and card lists.

- **Writes:** `card`.
- **Depends on:** no other module.

A card row is a projection of a card block in a doc, keyed by `(item_id, block_id)`; the doc stays the only source of
its text, and the row holds what the doc can't: the status (new, review, got it). `docs` writes the rows on every save
through `syncCards(ctx, itemId, cards)` (`api.ts`), inside its own transaction, in three steps:

1. forget this doc's cards removed more than seven days ago;
2. upsert every card on `(item_id, block_id)`: position, question, answer, `removed_at = null`, status untouched. A row
   whose text and place didn't change isn't written (`is distinct from`), so an autosave of a long doc touches only the
   card that was edited;
3. mark this doc's live cards that are missing from it `removed_at = now`.

So a card cut and pasted back (or brought back with ⌘Z) within seven days keeps its status, a copy in another doc is a
new row, and one back after more than seven days is new again. Readers see only live cards, through
`domain/live-cards.ts`; `cardStatusesIn(ctx, itemId)` gives the statuses of a doc's live cards by block id.
