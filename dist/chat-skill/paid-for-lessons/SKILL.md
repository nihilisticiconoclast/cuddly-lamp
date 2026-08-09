---
name: paid-for-lessons
description: >-
  Habits for work where being wrong is quiet: verifying a result instead of inferring it,
  noticing an approach is failing rather than tuning it, handing a task to someone else, and
  building on data you did not collect. Use when about to say something works, is done, is
  fixed, or is complete; when a fix has not landed twice or you are adding another parameter;
  when writing a brief, spec or prompt for someone else to execute; when reviewing delegated
  work that cites identifiers, counts or confidence levels; and when scraping, joining, or
  querying data from a source you do not control.
---

# Paid-for lessons

**One rule, and everything below is a way of applying it:**

> Build the instrument that says you are wrong, before you need it.

Not because mistakes are avoidable — they are not, and none of the work behind this was
error-free. The difference between a good day and a bad one was never the number of mistakes.
It was **how long each one stayed invisible**.

Two builds paid for this. In the first, a site served the wrong content for a week under a
green tick, a generated config was silently corrupt for just as long, and a heuristic absorbed
a day of tuning before being replaced in twenty minutes by something simpler. In the second, a
day of parallel work produced three production-only bugs, a 591-million-read database day, and
a backfill that captured 16% of a corpus and reported success — and every one of those was
caught within minutes, because there was something to catch it with.

Nothing in the first build was hard to fix once seen. Everything in it was hard to see.

---

## 1. Nothing is true because a process finished

The most expensive errors all share a shape: **a success signal that was not about the thing
being claimed.**

- **A green deploy is not a live site.** A workflow reported success with the correct URL on
  every push for a week; the host was serving the repository's `README.md` the whole time,
  from a different source setting entirely. The job genuinely succeeded. It was not the claim
  anyone cared about. Check what is *served*, not what is *deployed*.
- **A generated file that fails to parse fails silently.** A build wrote a config the page
  loaded, and let log annotations share the pipe with the payload. The `<script>` threw on
  the first line, the app fell back to defaults, and defaults look deliberate. Never redirect
  a generator's stdout into the artifact it generates, and syntax-check generated code in the
  build — `node --check out.js` is one line and would have failed on the first push.
- **An undocumented API truncating its response returns HTTP 200.** A run that stops at 16% is
  byte-for-byte indistinguishable from one that finished. Absence of an error is not evidence
  of completeness; a count from an independent endpoint is.
- **A parameter that is wrong can look like an empty result.** One export endpoint honoured
  `from`/`to` and returned zero rows — no error — for the plausible-looking `date_from`/
  `date_to`. Before trusting a parameter, confirm it *changes* the output.

**The habit:** for each claim you are about to make, name the observation that would falsify
it, and make that observation. "The deploy succeeded" is not an answer to "the page is blank".

## 2. Measure the thing that costs, not the thing you can see

A batch update took 18 minutes. Rewritten as a single statement it took **19 seconds**, and
was reported as fixed. It read exactly the same **139 million rows**. The metered cost — the
only thing that actually mattered — was unchanged, and one day's usage reached 591 million
reads against a database holding 130,000 rows.

The stopwatch had been measuring round-trips. Round-trips were never the expense.

- On any metered system, read the query plan, not the clock. A scan inside a correlated
  subquery means you are paying the product of two tables, and it will feel fast.
- **Test through the production client**, not a convenient local stand-in. Three bugs here
  existed only against the hosted database; two vanished the moment local tests used the same
  driver. The third was the network itself and could not be reproduced locally at all — so it
  was written down as a known gap rather than covered by silence.
- **Check both directions of a change.** A join fix aimed at 19 duplicate rows inflated
  results by 1,439 when tested — and the same investigation found the join was silently
  *dropping* 160 records, which mattered more and which de-duplication would never have
  revealed. Quote rows gained *and* rows lost.

## 3. Tell wandering apart from converging

Persistence and stubbornness are identical from the inside. The only difference is whether the
thing is improving, and that has to be measured rather than felt.

Four signals, all of which were present by round two of a day-long tuning session:

- **Each fix produces a different wrong answer, not a closer one.** 26%, then 43%, then 16%
  but flat, then 10% in the wrong place. Every individual fix was a real improvement to a real
  defect, and the model underneath was still wrong.
- **You are adding parameters.** A threshold, a weight, a cap, a radius. Each knob is evidence
  that the model does not describe the problem. Three in a row is a rewrite signal.
- **The same complaint has come back.** Someone raising the same symptom a second time
  outranks your sense of progress completely. It is a hard interrupt, not a request for
  another tweak.
- **You cannot write the success condition as an assertion.** Writing it down often produces
  the answer for free: "closed, in the distance band, no road, passes the summit" is four
  assertions, and the moment they were written the right algorithm was obvious.

**Budget the approach, not just the task.** Before the second attempt, decide how many
attempts this approach gets — two or three — and what the metric is. When the budget is spent,
the next move is a different approach, not attempt N+1. Say it out loud both times.

Two corollaries worth their own line:

- **Remove the option rather than penalising it.** A penalty can be outvoted by every other
  term in the score, so the argument repeats with new numbers each round. Taking the option
  out of the search space is correct by construction — and that is a property you can assert.
- **When each attempt is slow, iterate less and think more.** A slow loop reliably causes the
  opposite, because waiting feels like working. Buy the fast loop first — pull the data local,
  commit a fixture — and make failures say *what was found*: "no loop found" cost several
  rounds; "17 in band but >25% road, 230 in band but none within 500 m" identified two
  distinct bugs in a single run.

## 4. Make uncertainty visible in the artifact, not just in your head

**A wrong identifier is worse than a missing one.** A null is visibly unresolved and invites
another pass. A plausible-but-wrong value silently corrupts every downstream use and is very
hard to notice later. That asymmetry justified rejecting 240 of 5,728 matches where the
evidence did not distinguish between candidates — a guess dressed as a match. Rejected rows
kept their candidates on file, so "rejected" meant "not asserted", not "discarded".

Resist optimising the coverage percentage. It is the number most visible in a report and the
one least worth maximising.

**Use the whole confidence scale.** One run emitted no `low` band at all, collapsing four
levels to three, and two rows marked `high` were wrong. Review *samples*; it does not check
everything. So an over-confident row does more damage than an honestly uncertain one — it buys
itself a lower chance of being looked at. Check the distribution before checking any row; a
missing band is a finding on its own.

## 5. Handing work to someone else

Everything above is about your own instrument. A brief is someone else's.

**Give an oracle, not a warning.** The clearest single result: one agent was given 1,851
labelled rows and told to score against them before trusting itself, and its work held up.
Another was given a written warning that the source truncates silently, and no way to measure
whether it had — it captured 55,000 rows of a 336,654-row corpus and reported success. The
instrument that would have caught it existed the whole time, one request away.

A warning only confirms the belief that you are being careful. A number changes the outcome.
So the test of a brief is not "have I described the task" but:

> Can they tell, without me, whether they succeeded?

If not, the task is not ready to hand over. Write the oracle first — a labelled sample, an
independent count, an expected total — and hand it over with the task. If none exists, say so,
and make finding one the first deliverable.

Four things that follow:

- **Make the acceptance test a number.** "Backfill the archive" is unfalsifiable. "Expect
  336,654 rows for this window; report your count and the endpoint's count" can be verified on
  return by someone who did not do the work.
- **Confirm the gap is real before asking anyone to fill it.** Three tasks here were planned
  around inference the source already answered outright — a published ID, a stated
  classification, an existing column. Each was caught by looking at the data before writing
  the brief, and each would otherwise have been a day spent rebuilding something already
  there.
- **Give a queue, not a task** — one item fully specified, the rest deliberately sketched.
  Sketch them thinly on purpose: three later tasks were rewritten or dropped once the earlier
  work revealed the source already answered them.
- **Say the boundaries out loud.** Which files not to touch, which work is not theirs. They
  are not politeness; they are the mechanism that lets work happen in parallel. Nobody can
  infer a boundary that exists only in your head.

**Then check what comes back, remembering that prose and data are separately trustworthy.** A
write-up cited an identifier that does not exist and a second belonging to a different county
— while its data file was correct throughout. The data came from a query; the sentence came
from memory of the query. Verify every identifier that appears in a sentence.

**And resolve disagreements by measuring.** When two accounts of a quantity differed by seven
times, the temptation was to reason about which was more credible. Three requests settled it
in about a minute. Consulting the thing both accounts are about is faster than adjudicating
between them, and produces a conclusion you can show rather than defend.

## 6. Report the metric, not the process

"CI is green", "the tests pass", "the job ran" are not progress if the thing that was asked
for is unchanged. Every update should say where *that* stands, even when the answer is "no
better than last time".

- **Separate what you verified from what you believe.** "Deployed successfully" and "I loaded
  it and it works" are different claims; conflating them is how a site served the wrong
  content for a week under a green tick. If you could not check, say so and say why.
- **Do not lead with a remedy that shifts work to the other person** — clear your cache,
  re-run the job, tick this box — before ruling out the causes you can fix yourself. It is
  right often enough to become a habit, and it spends trust badly when the cause is
  structural.
- **Volunteer the sunk cost.** When an approach is abandoned, say what it cost and what the
  signal was. It is the only way the next person does not pay for it again.
- **Write decisions down with the numbers in them.** Problem, what was measured, what was
  chosen, what the acceptance test is. Short records like that did more good than any amount
  of commentary — and they are what makes delegation possible at all.

---

## The check, before saying it works

- [ ] What observation would show this is wrong, and did I make it?
- [ ] Am I quoting what I verified, or what a process reported?
- [ ] Is the number I optimised the number that actually costs?
- [ ] Did the last attempt move the metric in the right direction — and how many attempts has
      *this approach* had?
- [ ] Did I add a parameter this round? How many in a row now?
- [ ] Is anything uncertain recorded as uncertain, rather than guessed into a value?
- [ ] Does every identifier in what I wrote exist in the thing I am describing?
- [ ] Would the person reading this know what I could not check?
