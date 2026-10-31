# 0003. Ownership through composite foreign keys

- Date: 2026-10-31
- Status: Accepted

## Context

Every row in Kotsu belongs to one user, and many rows point at other rows: a card sits in a doc, a practice
session draws cards, an event links a doc, a card or a practice preset. The ids that make those links arrive
from the UI, from Server Actions and from MCP tools, where an assistant fills them in and a prompt injection
can choose them. A plain foreign key only checks that the target exists, so one missed `user_id` filter in
the domain code would let a user attach a card to someone else's doc or draw someone else's cards.

Options considered:

- **Domain checks only**: every write looks up its targets by id and `user_id` first. It works until one
  function forgets, and nothing in the database notices.
- **Row-level security**: Postgres policies that compare each row's `user_id` with a setting made at the
  start of every transaction. The policies check rows, not links: foreign key checks bypass row security, so
  a card of mine could still point at someone else's doc. Every read would also need a transaction that
  sets the user first.
- **Composite foreign keys**: `user_id` on every table and in every reference.

## Decision

- Every app table has `user_id uuid not null`, referencing the user with `on delete cascade`.
- Every table that other rows point at has `unique (id, user_id)`, because a composite foreign key needs a
  unique index on its target.
- Every reference from one user row to another is a composite key `(x_id, user_id) → x(id, user_id)`.
  Required references cascade on delete.
- Optional references have no delete action: the domain clears them in the same transaction before it
  deletes the target. `on delete set null` would null `user_id` as well; Postgres 15+ can limit it to one
  column, but Drizzle can't express that.

The domain still filters every query by `ctx.userId`. The keys are the second line: a foreign id can't be
stored even when a query forgets.

## Consequences

- A link between two users' rows can't exist, whoever sent the id. The domain looks up targets by id and
  user first and answers `NOT_FOUND`; a foreign key violation that still reaches the database means a domain
  bug, and the write fails as `INTERNAL` instead of landing in someone else's data.
- Each table carries a `user_id` column and one extra unique index, and range reads can filter by user
  without a join.
- Every module has a test where user B tries to read or point at user A's rows.
- A forgotten optional reference makes the delete fail loudly instead of leaving a dangling id.
- Sharing rows between users later would need a different model for the shared tables; Kotsu has no sharing
  in v1.
