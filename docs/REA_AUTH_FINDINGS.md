# REA Findings — Authenticated Product Surface

This is a redacted, implementation-oriented record of UI behaviour observed in a browser session that the user had already authenticated. It contains no credentials, email addresses, screenshots, source code, cookies, storage values, or exported account data.

## Scope and safeguards

- Target: `https://app.pnlledger.com/`
- Method: passive REA CDP inspection and screenshot capture from a user-provided, dedicated browser profile.
- Authority: the user navigated to each already-authorized view. The inspection did not create, change, export, delete, or restore any data.
- Purpose: guide an original local trading-journal implementation; no PnL Ledger source, assets, or branding will be reused.

## Observed desktop layout

| Area | Observed behaviour | Evidence |
| --- | --- | --- |
| App shell | Black canvas, narrow left icon rail, primary content at desktop width, account selector in the upper-right and a small legal/footer row at the bottom. | `ev_1391e151d7d23f00f7ec87a5208ca9ceb5991c014a322d4e4880067e59d4c763` |
| Calendar / Month | Four time-scope tabs; period navigation; side-by-side P&L and goal cards; weekend/account controls; calendar tiles with positive, negative, empty and selected states. | `ev_1391e151d7d23f00f7ec87a5208ca9ceb5991c014a322d4e4880067e59d4c763` |
| Calendar / Week | Week range navigation; full-width P&L card; account selector; daily rows with result, trade-count, and outcome direction. | `ev_f6b6d69afa8697aa46acf9b326a442a6489f88949e50cf4939bc15dba1b8b094` |
| Calendar / Year | Year navigation; P&L and yearly-goal cards; monthly mini-calendars arranged responsively in a multi-column grid. | `ev_b01eec774d4f344777b921ef28d3d3a2c0650a635e65ae6fb84efa9dab0a0d1e` |
| Calendar / All time | Aggregate P&L; selectable yearly totals with gain/loss colour; quick-stat card and a route to analytics. | `ev_af6f27aa6f00f7128888f32c23db4e690f094ed8dc745422979c695dab48f359` |
| Analytics | Account and time-range selectors; drawdown entry card; Profit/Loss card with expandable detail affordance, circular breakdown and legend. | `ev_2811d05560a72eb4fb89b7fb7fe2d420b1781b60042465ca64a31a12019cb8f3` |
| Settings | General toggles for trade-count display and P&L privacy; account management items; product/support and premium sections. Identifying account text is deliberately omitted. | `ev_145b79f3f2cd3421d914693071cf430603146cbc3e1b4310c7f1061394e5ddff` |

## Inferences for Tradeboard

These are design inferences, not claims about the inspected implementation:

1. Make the calendar the primary product surface, not a generic dashboard.
2. Use a dark desktop shell with compact icon navigation and a mobile bottom navigation pattern.
3. Preserve functional local data flows: date navigation, time-scope views, calendar settings, privacy, account context, trade editing, and export.
4. Reinterpret the visual system with Tradeboard names, original iconography, and independently written markup/styles.

## Limitations

- Flutter canvas rendering did not expose visible controls in the accessibility tree, so this record is based primarily on passive visual observations.
- The captures establish currently observed presentation and high-level interaction intent, not internal business rules, API contracts, data model, or premium entitlements.
