---
name: data-plumbing
description: >-
  How to build a dataset on top of somebody else's data without silently corrupting it. Use
  when scraping or paging an undocumented third-party API, when running against a hosted or
  metered database (Turso/libSQL, Neon, PlanetScale, BigQuery), when a join changes row
  counts, when deciding whether to record a match or a NULL, and when deciding what of a data
  project belongs in git. Not for application schema design or ORM work.
---

# Data plumbing

Every rule here was paid for building a corpus out of three third-party sources. The theme is
one thing: **the failures in this kind of work do not raise errors.** They return HTTP 200,
they return a plausible ID, they return in 19 seconds. Everything below is a way of making a
silent failure say something.

---

## 1. Third-party APIs lie in ways that look like success

The source here answered sustained querying by **truncating the response body and returning
HTTP 200**. A run that stopped at 16% of the corpus was byte-for-byte indistinguishable from
one that finished: no error, no partial-content status, no short read at the socket level.
Just fewer rows than exist, and no way to know it from inside the run.

- **Assume any undocumented API throttles**, and that its throttling is silent. Rate-limit
  from the start rather than after being cut off, because the cut-off is not observable.
- **Cache every response to disk.** The expensive thing is the fetch; make a re-run of the
  parse free, and make the raw bytes available when a number is later disputed.
- **Build a completeness check from an independent endpoint.** An expected count for the same
  window, fetched a different way, is the only thing that distinguishes "finished" from
  "stopped". Absence of an error is not evidence.

**The docs are often wrong about themselves.** The export endpoint here honours `from`/`to`;
the plausible-looking `date_from`/`date_to` return **zero rows rather than erroring** — a
parameter name that is wrong in a way that looks like an empty result set. Before trusting any
parameter, verify it changes the output: request a window you know is populated, then the same
window with the parameter altered, and confirm the two differ.

## 2. Latency and cost are different problems, and only one is visible

A batch update took 18 minutes. Batching it into a single statement brought it to **19
seconds**, and it was reported as fixed.

**It read exactly the same 139 million rows.** The metered cost — the thing that actually
mattered — was completely unchanged. The stopwatch had been measuring network round-trips, and
round-trips were never the expense.

One day's usage reached **591 million row reads against a database holding 130,000 rows**,
from two statements that both looked entirely ordinary.

On any metered system, **check the plan, not the stopwatch**: `EXPLAIN QUERY PLAN` before and
after, quoted in the commit message. A `SCAN` inside a correlated subquery means you are
paying the product of two tables, and it will run fast enough to feel fine.

Track reads as a first-class number the same way you track wall time. If your provider exposes
a usage figure, look at it at the end of the day you optimised something.

## 3. Use the production client library locally

Three bugs here were invisible locally and appeared only against the hosted database:

| Bug | Why local missed it |
| --- | --- |
| NaN never converted to NULL | SQLite silently stores NaN as NULL; the server rejects it |
| Double-quoted SQL string literal | stdlib `sqlite3` accepts it as a string; the server rejects it as an identifier |
| `executemany()` at 4.1 rows/s, then stalling | It is a network round-trip problem, and there is no network locally |

Two of the three vanished by using **the same client library locally as in production** — an
embedded connection through the production driver rather than the language's bundled SQLite.
That one change turned local testing from an approximation into a real check, at the cost of a
dependency.

The third could not be reproduced locally at all, because the whole bug was the network.
**Where a gap remains, write it down** in the test file rather than claiming coverage you do
not have. "This suite cannot detect round-trip cost; measure that against staging" is a useful
sentence. Silence there reads as coverage.

## 4. A wrong identifier is worse than a missing one

Adjudicating 5,728 matches, the operating rule was:

> A NULL is visibly unresolved and invites another pass. A plausible-but-wrong ID silently
> corrupts every downstream query and is very hard to notice later.

That asymmetry justified **rejecting 240 matches** where the resolver had picked a building in
a multi-building town with **no distinguishing name to go on** — a guess dressed as a match.
Accepting them would have raised the coverage number and lowered the trustworthiness of every
query anyone ran afterwards.

Rejected rows keep their candidates on file, so **"rejected" means "not asserted", not
"discarded"**. A later pass with better evidence picks them straight up, and the reasoning for
the rejection is there to be disagreed with.

Resist optimising for the coverage percentage. It is the number most visible in a report and
the one least worth maximising.

## 5. Check the obvious fix before recommending it

A key column was not unique, so a join fanned out and produced 19 duplicate rows. The obvious
remedy — "join the superset table instead" — was written into a draft spec before anyone
tested it.

Tested, it **inflated results by 1,439 rows against the 19 it was meant to fix**, because that
table is not unique either.

The same investigation turned up something the duplication had hidden: the join was silently
**dropping 160 records**. That mattered more than the duplication, and de-duplicating would
never have revealed it — the fix and the real bug pointed in opposite directions.

**Run the fix against real data before it goes into a spec**, and check both directions:
rows gained *and* rows lost. Any change to a join gets a before/after row count on both sides,
quoted.

---

## Keeping the work

## 6. Commit the recipe, not the output

What belongs in the repository is whatever **cannot be regenerated**: schema, loaders, and
every adjudication decision with its reasoning. Raw sources are re-downloadable and the
assembled database rebuilt in 90 seconds, so neither needed committing.

A 40 MB database *was* committed here, for the defensible reason that the live one was
temporarily frozen. It came out again a few hours later — it was heading for GitHub's 100 MB
limit, and **a binary that changes wholesale on every rebuild stays in git history forever**,
at full size, for every clone. Use a Release asset when a large file genuinely needs sharing.

The decisions are the irreplaceable part. Data can be rebuilt; the judgement about which of
two candidate matches was right cannot.

## 7. Recorded SQL must be the SQL that runs

A `queries/` folder that duplicates the real queries is worse than not having one: it looks
authoritative while quietly going stale, and the first person to trust it is the one who did
not write it.

Make the recorded query and the executed query **the same bytes**. The build script here reads
those files at build time, so they cannot diverge. Any documentation of a query that is not
executed from its own file will be wrong within a month.

## 8. Dual-license data and code separately, explicitly

The code was MIT; the data was CC BY-SA 4.0, inherited from its source.

**Putting data into an MIT repository does not relicense it**, and share-alike travels with
anything substantially derived from it. Say so in a file next to the data — the licence, the
attribution, and the note that changes were made — rather than assuming the repository's
top-level `LICENSE` covers everything under it.

---

## Before saying the data is right

- [ ] Row count compared against an independent count from the source, not internal totals.
- [ ] Every API parameter verified to change the output, not just to be accepted.
- [ ] `EXPLAIN QUERY PLAN` checked for anything running per-row; reads measured, not seconds.
- [ ] Local tests run through the production client library, with remaining gaps written down.
- [ ] Joins checked for rows *lost* as well as rows duplicated, both counts quoted.
- [ ] Uncertain matches left NULL with candidates retained, rather than guessed.
- [ ] Nothing regenerable committed; every decision and its reasoning committed.
