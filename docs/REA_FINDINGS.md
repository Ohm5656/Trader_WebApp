# REA Findings — PnL Ledger Public Surface

This document records observed behaviour and implementation-oriented design facts. It deliberately excludes copied application source, assets, and screenshots.

## Scope and safeguards

- Target: `https://app.pnlledger.com/`
- Method: REA Playwright browser scenario in a disposable, provider-owned Chrome profile.
- Access: public, logged-out surface only; no credentials, account creation, payment flow, or premium gate was used.
- Purpose: inform an original implementation of a trading-journal workflow and visual direction.

## Observed facts

| Observation | Evidence |
| --- | --- |
| Visiting the root redirects to `/welcome`. | `ev_7069f597b85cd669bb0689c59d54aa7d033a848da2daae05d1a214a699d393d9` |
| The public welcome surface is a mobile-first black screen with high-contrast white typography, a cyan accent, a product mark, and Register/Login actions. | `ev_7069f597b85cd669bb0689c59d54aa7d033a848da2daae05d1a214a699d393d9` |
| The public web client identifies itself as a Flutter-rendered web application. | `ev_7069f597b85cd669bb0689c59d54aa7d033a848da2daae05d1a214a699d393d9` |
| The public DOM references the Urbanist font family in regular, medium, semibold, and bold weights. | `ev_7069f597b85cd669bb0689c59d54aa7d033a848da2daae05d1a214a699d393d9` |
| Flutter did not expose the visible Login control in the browser accessibility tree during this capture, so REA could not safely target it through a semantic locator. | `ev_781cb2e92731336c2f221beab0dd2dcd3d5ce0e4254a7db28e3baf50ae805ded` |

## Limits of this pass

The logged-in calendar, analytics, trade-entry, export, settings, and account flows cannot be established from the public landing state. The next pass should use a user-authenticated browser profile and observe only pages the user is already entitled to access.

## Implementation implications

The local app should be revised from its current dashboard-first desktop presentation toward the observed mobile-first hierarchy and visual tokens, then compared screen-by-screen against authenticated evidence. The implementation must remain original and must not copy PnL Ledger code, assets, or branding.
