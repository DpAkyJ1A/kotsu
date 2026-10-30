# 0002. AGPL-3.0 license

- Date: 2026-10-30
- Status: Accepted

## Context

Kotsu is open source. Its sheets calculate formulas with HyperFormula, which is offered under GPL-3.0 or a
paid proprietary license; Kotsu uses it under GPL-3.0 (`licenseKey: 'gpl-v3'`). HyperFormula runs in the
browser, so every copy of Kotsu's JavaScript bundle includes it, and GPL-3.0 requires a combined work to be
licensed as a whole under GPL-3.0 to everyone who receives it. A permissive license on Kotsu's own code
wouldn't make the app permissively licensed; it would only make the label misleading.

Kotsu is a web app: people use it over a network rather than receive a copy. Under GPL-3.0, someone could
run a modified Kotsu as a hosted service without sharing their changes.

## Decision

Kotsu is licensed under the GNU Affero General Public License, version 3 only (`AGPL-3.0-only`). The full
text is in [`LICENSE`](../../LICENSE).

## Consequences

- The app has one copyleft license throughout: section 13 of GPL-3.0 and of AGPL-3.0 allows combining code
  under the two.
- Anyone who runs a modified Kotsu for other people over a network must offer those users the source of that
  version.
- "Only" means a future version of the AGPL doesn't apply automatically; moving to one is a deliberate
  choice.
- A closed or differently licensed edition would need HyperFormula replaced or a commercial license for it,
  and the consent of every contributor whose code it includes. The formula engine is kept behind an
  interface so that replacing it stays possible.
