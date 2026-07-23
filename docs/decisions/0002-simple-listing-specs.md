# ADR 0002: Keep bike specifications simple and relational

Status: Accepted

## Decision

Store the main bike specifications directly on `listings`. Do not create a full bicycle catalog or component hierarchy in the MVP.

## Reason

Private sellers should complete the form quickly. The platform needs reliable filters, not perfect manufacturer data.

## Consequences

- Brand, model and component names are user-entered.
- Moderation and later normalization handle spelling variants.
- A catalog can be added later without blocking the first marketplace.
