---
name: briefing-agents
description: >-
  How to write a brief another agent can succeed at, and how to check what comes back. Use
  when splitting work across parallel agents or sessions, when writing a task spec or roadmap
  for someone else to execute, when two agents report numbers that disagree, and when
  reviewing delegated output — especially a write-up that cites identifiers, counts, or
  confidence levels. Read it while writing the brief, not after the work returns.
---

# Briefing agents

Every rule here was paid for in one day of three agents working in parallel on a shared
repository. The failures were not capability failures. In every case the agent did what the
brief made possible, and the brief made the wrong thing possible.

---

## 1. Give an agent an oracle, not just a warning

The clearest result of the day. Two agents, comparable capability, opposite outcomes:

- One was given **1,851 labelled rows** and told to score against them before trusting
  itself. Its work held up.
- The other was given a **written warning** that the source truncates silently, and no way to
  measure whether it had been truncated. Its backfill captured **55,000 rows of a
  336,654-row corpus — 16% — and reported success.**

The instrument that would have caught it existed the whole time: the source's own search
endpoint reports a result count for any window, in one request. Nobody went looking for it
until the failure had to be adjudicated.

**A brief that names a hazard without supplying the measurement is close to useless.** The
agent already believes it is being careful; a warning only confirms that belief. What changes
the outcome is a number it can compute and compare.

So the test for a brief is not "have I described the task" but:

> Can the agent tell, without me, whether it succeeded?

If you cannot answer that, the task is not ready to hand over. Write the oracle first — a
labelled sample, an independent count, an expected row total, a checksum — and hand it over
with the task. If no oracle exists, say so explicitly in the brief and make *finding one* the
first deliverable.

## 2. Specify the acceptance test as a number

A spec that says "backfill the archive" is unfalsifiable. A spec that says "expect 336,654
rows for 1990–2024; report the count you got and the count the search endpoint reports for the
same window" can be handed over and verified on return, by someone who did not do the work.

The same applies to your own decision records: the problem, what was measured, what was
chosen, what the acceptance test is. Short records with numbers in them did more good here
than any amount of code commentary, and they are the reason delegation was possible at all.

## 3. Confirm the gap is real before filling it

Three separate times a task was planned around inference the source already answered:

| Planned as hard | Actually |
| --- | --- |
| Match performances to buildings by name | The source publishes the building ID; ~94% carry it, 99.5% resolve |
| Classify records into families | The library states the classification on every record |
| Group records into naming families | It is already a column |

Each was caught by looking at the data before writing the brief — and each would have been a
day of agent time producing a worse version of something already there.

Make it a standing instruction in every brief: **confirm the gap is real before filling it,
and say so in the report.** An agent that opens with "this was already a column, so I did X
instead" has done the most valuable thing it could have done that day.

## 4. Give each agent a queue, not a task

A single task means an agent stalls waiting for a new brief, and stalling costs more than
over-specifying. A numbered roadmap — **one task fully specified, the rest deliberately
sketched** — keeps work flowing.

Sketch the later ones thinly on purpose. Three tasks here were rewritten or dropped once the
earlier work revealed the source already answered them; anything written in detail up front
would have been detail thrown away.

## 5. Say the boundaries out loud

The first PR of the day did both agents' briefs in one branch. The work was fine, and it
defeated the entire point of splitting them.

Boundaries are not politeness, they are the mechanism that lets the work happen at once. Every
brief needs, explicitly:

- **the task, and a line saying not to take on the other agent's task**
- **a list of files not to touch**
- **its own branch**

An agent cannot infer a boundary that exists only in your head, and it will helpfully fix the
thing next door.

---

## Checking what comes back

## 6. An agent's data can be right while its prose is invented

A resolution write-up cited a building ID that does not exist, and a second one that belongs
to a different town in a different county. **The CSV rows were correct throughout.** Only the
narrative was wrong — which made the document read as authoritative while being partly
fabricated, and made the correct data underneath look suspect.

Treat generated prose and generated data as **separately trustworthy**. They are produced by
different processes and fail in different ways: the data came from a query, the sentence came
from memory of the query.

**Verify every identifier that appears in a sentence.** Names, IDs, counts, dates. It is a
cheap grep against the artifact the prose is describing, and it is the single highest-yield
review action on delegated work.

## 7. Insist on the whole confidence scale, then check the distribution

That same run emitted **no `low` band at all**, collapsing a four-level scale to three — and
two rows marked `high` were wrong.

This matters more than it first looks. Adjudication *samples*; it does not check every row.
Sampling only works if confidence is honest, so **an over-confident row does more damage than
an honestly uncertain one**: it buys itself a lower chance of being looked at.

Ask for calibration explicitly in the brief, and on return check the distribution before
checking any individual row. A missing band is a finding on its own.

## 8. Resolve disagreements by measuring, not by arbitrating

When two agents reported counts differing by **seven times**, the temptation was to reason
about which was more credible — which had the better method, which had been more careful.

Three HTTP requests settled it instead: 25,859 for one year, 25,267 for the next, 336,654 for
the full period. Cost: about a minute.

**When two agents disagree about a quantity, go and measure the quantity.** Adjudicating
between two accounts is slower than consulting the thing both accounts are about, and it
produces a conclusion you have to defend rather than one you can show.

---

## Before handing a brief over

- [ ] Can the agent tell whether it succeeded, without me? What is the instrument?
- [ ] Is the acceptance test a number?
- [ ] Have I checked the source actually lacks what I am asking the agent to infer?
- [ ] Is there a next task queued, so it does not stall?
- [ ] Does it say which files not to touch, and not to take on the other agent's work?
- [ ] Have I asked for the full confidence scale, and for gaps to be reported as gaps?

## Before accepting what comes back

- [ ] Every identifier in the prose checked against the data it describes.
- [ ] Confidence distribution inspected before any individual row.
- [ ] Reported totals compared against an independent count, not just internal consistency.
- [ ] Any disagreement resolved by measurement, with the measurement quoted.
