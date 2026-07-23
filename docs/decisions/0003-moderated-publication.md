# ADR 0003: Require approved ownership evidence before publication

Status: Accepted

## Decision

A database trigger blocks `published` listings unless at least one ownership document is approved.

## Reason

The trust promise must survive direct API calls and UI bugs.

## Consequences

- The first version needs a moderator queue.
- Publication has more friction than general marketplaces.
- Document processing remains manual until enough volume exists.
