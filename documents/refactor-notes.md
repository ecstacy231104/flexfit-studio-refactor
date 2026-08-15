
# Refactor notes — Project 1

## What changed

Extracted two functions that were copy-pasted identically across three
router files (`bookings.ts`, `reschedules.ts`, `corporate-bookings.ts`)
into a single shared module: `src/server/domain/booking-time.ts`.

- `hoursUntil(iso, now?)` — used everywhere a booking/cancel/reschedule
  needs to know how far away a class is, to enforce free-cancellation and
  free-reschedule windows.
- `activeMembershipFor(db, userId)` — looks up a member's current active
  membership. Used by `bookings.ts` and `reschedules.ts` (corporate
  bookings uses a different lookup, `getCompanyForMember`, since company
  credit pools are a separate concept — left that one alone).

Both were byte-for-byte identical in all the places they appeared, which
made this a safe, low-risk first extraction: no behavior decisions had to
be made, just deduplication.

## Why this first

These two functions sit underneath almost every booking-related mutation
(book, cancel, reschedule, corporate booking, corporate cancel). Any future
change to cancellation-window logic or membership eligibility rules
previously had to be made in three places and would silently drift if
someone forgot one. Now it's one place.

## Bonus fix: schedule page infinite refetch

While testing, found that `src/app/schedule/page.tsx` called
`new Date().toISOString()` directly inside the component body on every
render. Since that string is never equal to itself between renders, React
Query treated it as a new query each time and refetched endlessly instead
of settling — visible in the dev server logs as a continuous stream of
`classes.list` requests. Fixed by computing the timestamp once with
`useMemo`. Unrelated to the domain-module extraction, but found while
verifying behavior, so fixed rather than left — the brief says either
option earns credit, and this one was quick and low-risk.

## What I verified

- `npx tsc --noEmit` — clean compile after both changes.
- Ran the app locally against the seeded dataset.
- Booked a class, confirmed it appeared in "My bookings" as BOOKED,
  cancelled it, confirmed it updated to CANCELLED — matching original
  behavior end to end through the UI, not just at the type level.

## What I deliberately left alone

- `getCompanyForMember` in `corporate-bookings.ts` looks similar in shape
  to `activeMembershipFor` but represents a different concept (company
  credit pool eligibility vs. individual membership), so kept separate
  rather than forcing them into one function.
- Didn't go hunting for further unrelated cleanup beyond what was directly
  adjacent to the changes above, to keep the change small and reviewable
  under time constraints.

## Next steps if continuing

The booking/cancel/waitlist-promotion logic itself (not just the two
helper functions) is still duplicated in shape between `bookings.ts` and
`corporate-bookings.ts`. A further step would be extracting a generic
`promoteFromWaitlist` / `refundCredits`, parameterized by which
table/credit-pool is being used.