# onboarding

The first-run template picker and the templates.

A new account has no `onboarded_at` in its settings, so the app layout sends every page to `/onboarding?next=…` (the
page it asked for, left out for the home page). `TemplatePicker` shows four radio cards, Learn a language, Study a
course, Job search & growth and Start blank, each with the shelves it makes, and Continue. `completeOnboarding` takes
the template and the browser's time zone (one the server doesn't know becomes UTC) and, in one transaction, marks the
account onboarded through `account` and makes the template's shelves through `shelves`, in the colour each shelf's turn
gets, so the preview's dots match for a new account. A second call, from another tab say, changes nothing. The action
renders the page again, and the page sends an onboarded account on to `next`, as it does when one opens `/onboarding`.

The templates are data, one file per language in `core/templates/`, named in the user's interface language. For now
they make only shelves; docs and cards (1.19), the schedule (stage 2) and the sheet (stage 5) come later.

- **Writes:** nothing itself; it creates a template's content through the other modules' `api.ts`.
- **Depends on:** `account`, `shelves`, `cards`, `docs`, `sheets`, `calendar`, `practice`.
