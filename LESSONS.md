# Lessons learnt

Two bodies of work, one list.

Lessons 1–11 came from a static-site and routing build: a week of a site serving
the wrong content under a green tick, and most of a day tuning one heuristic
through slow CI.

Lessons 12–28 came from the first day of building a bell-ringing corpus with
three agents — Claude Code, Mistral Vibe and Gemini CLI — working in parallel on
a shared repository.

Most of them are also installed as skills in `.claude/skills/`, so an agent
picks them up at the moment they apply rather than by reading this file — see
[Where these live](#where-these-live) at the bottom. This document is the
human-readable version, and the place where the evidence is kept.

Everything below cost something. Where a lesson has a number attached, the
number was measured, not estimated. The specifics are here as evidence, not
because the next project will look anything like these two.

---

## Shipping and verifying

### 1. A green deploy is not a live site

Check what is *served*, not what is *deployed*. These are different claims, and
only one of them is what the user is looking at.

A GitHub Pages workflow uploaded an artifact and reported `Reported success!`
with the correct environment URL, on every push, **for a week**. The site served
the repository's `README.md` the whole time, because Pages was set to *Deploy
from a branch* — under which GitHub runs Jekyll over the repo and renders
`README.md` as the index. The artifact was built, uploaded, deployed, and served
to nobody.

The tell was visible in the run list from the first hour: a `pages build and
deployment` run with event `dynamic`, sitting alongside the workflow's own run.
That is the legacy Jekyll builder, and it exists *only* under branch deployment.

If you cannot reach the public internet from where you are working, say so and
ask what the user sees. "The deploy succeeded" is not an answer to "the page is
blank" — and **never open with "try a hard refresh"**. It is right often enough
to become a habit, and it spends trust badly when the cause is structural.

### 2. A generated config that fails to parse fails silently

If the build writes a file the page then loads — a config, an injected key, a
feature flag — nothing about a broken one announces itself. A `<script>` that
fails to parse simply does not run: no network error, no missing file, no red
anywhere in the deploy. The application falls back to its defaults, and defaults
look deliberate.

A workflow generated `site/config.js` with `python - <<'PY' > site/config.js`,
and the script printed both its log annotations and the payload. Every `print`
went into the file:

```js
::notice::basemap=os-outdoor (OS key present)   // SyntaxError: Unexpected token ':'
window.WAYMARK_CONFIG = { ... };                // never reached
```

The API key had been configured correctly the whole time. The site served the
keyless fallback basemap for a week and reported no error to anyone.

- **Never redirect a generator's stdout into the artifact it generates.** Log
  lines and payload are two channels sharing one pipe. Write the file; print to
  the log.
- **Syntax-check generated code in the build.** `node --check out.js` is one line
  and would have failed the run on the first push. Assert the *shape* too — that
  the file is the single statement it is meant to be — which also catches a
  partial or doubled write.
- **Distinguish "absent" from "broken" in the consuming code**, and say which
  happened, in the page.

A log line you added to prove a fact, then missing from the log, is itself the
finding. The `::notice::` above existed precisely to answer "did the runner see
the key". Its absence was read as a truncated tail. Its absence *was* the bug,
sitting in full view.

### 3. Nothing at module scope may touch a library that might not load

```js
const state = { layer: L.layerGroup() };            // throws on parse if L is absent
const PROFILES = { a: { crs: L.CRS.EPSG3857 } };    // so does this
```

One `ReferenceError` before the first function definition means every line after
it never runs. Static markup still renders, so the page looks present and is
completely inert — the hardest failure to diagnose from a screenshot and the
easiest to misread as "nothing loaded".

Touch the library inside the init function, never at module scope; make config
entries that reference it lazy (`crs: () => L.CRS.EPSG3857`). **Vendor
load-bearing runtime dependencies** — if the page is meaningless without it, a
third-party origin should not stand between the user and it. And fail loudly *in
the page*: a blank rectangle with a clean console in somebody else's browser is
the hardest kind of bug to be told about.

### 4. Test with every external origin blocked

The single highest-value test for a static site, and the one that catches
lesson 3 immediately:

```js
await page.route('**/*', r =>
  r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
```

Load the page, then assert on what exists: library present, root component
mounted, data rendered, zero page errors.

Proxying CDNs from a local checkout — the obvious way to test offline — *hides*
this class of bug, because it makes the library available. That is exactly how a
broken page passed local verification repeatedly. Run the probe before *and*
after a fix, and quote both; "it works now" is worth far less than a
before/after on the same probe.

### 5. Cache-bust local assets at build time

A broken asset plus a browser cache is a site that stays broken specifically for
the person who already visited — the person reporting it. Stamp the build's
commit onto local asset URLs, so fresh HTML can never pair with a stale script:
`./app.js` → `./app.js?v=<short-sha>`.

---

## Knowing when to change course

Persistence and stubbornness look identical from the inside. The difference is
whether the thing is getting better, and that has to be measured rather than
felt. What follows exists because of a build that spent most of a day on one
routing heuristic across six slow CI rounds, produced a worse result each time,
and was then replaced in twenty minutes by a simpler algorithm that worked
immediately. Every signal below was present by round two.

### 6. A different wrong answer each time means the model is wrong, not underfit

The clearest signal and the easiest to miss, because every individual fix is a
genuine improvement to a genuine defect. Write the target metric down each
attempt. If it is not moving monotonically toward the goal — 26% road, then 43%,
then 16% but flat, then 10% but in the wrong valley — you are not converging,
you are wandering around a space where the model is wrong.

Three companion signals:

- **You are adding parameters.** A new threshold, weight, cap, radius. Each knob
  is evidence the model does not describe the problem. Three in a row is a
  rewrite signal.
- **The user has raised the same thing twice.** Their second complaint about the
  same symptom outranks your sense of progress completely. Treat it as a hard
  interrupt, not a request for another tweak.
- **You cannot state what "good" looks like as an assertion.** Writing it down
  often makes the right algorithm obvious: "closed, in the distance band, no
  road, passes the summit" is four assertions, and the moment they were written
  the answer was clearly *search for cycles* rather than *walk out and find a way
  back*.

### 7. Budget the approach, not just the task

Before the second attempt, decide how many attempts this approach gets — two or
three is usually right — and what the metric is. When the budget is spent, the
next move is *a different approach*, not attempt N+1.

Say it out loud when you set it and when you spend it. "This is the third time
weighting has not fixed it, so I am going to stop weighting and remove roads from
the graph instead" is a far better message than a fourth set of numbers. And
**volunteer the sunk cost** when you abandon something: what it cost, what the
signal was. It is the only way the next session does not pay it again.

### 8. When each attempt is expensive, iterate less and think more

A slow feedback loop — CI, a rate-limited API, a deploy — ought to cause that. It
reliably does the opposite, because waiting feels like working.

- **Buy the fast loop first.** Pull the input local, commit a fixture, publish an
  artifact. Whatever it costs, it costs less than six blind rounds. Delete it
  afterwards.
- **Instrument before you iterate.** Make failure say *what it found*. "No loop
  found" cost several rounds. "17 loops in band but more than 25% road; 230 in
  band but none within 500 m of the target" identified two distinct bugs in one
  run.
- **One diagnostic run beats three speculative fixes.** If you cannot say which
  of two theories is right, the next action is the run that distinguishes them.
- **Write the regression test at the moment you understand the bug**, against a
  synthetic input. Two real bugs here were caught by tests before CI saw them.

### 9. Remove the option rather than penalising it

When a search keeps choosing something it should not, weighting it more heavily
is usually the wrong fix and always the slower one: a penalty can be outvoted by
every other term in the score, so the argument repeats with new numbers each
round.

Take the option out of the search space and fall back only if nothing is found
without it. The result is then correct *by construction* rather than by hoping
the scoring holds — and that is a property you can assert in a test.

### 10. Report the user's metric, not your process

"CI is green", "the tests pass", "the survey ran" are not progress if the thing
they asked for is unchanged. Every update should state where *that* stands, even
when the answer is "no better than last time".

Separate what you verified from what you believe. "Deployed successfully" and "I
loaded it and it works" are different claims; conflating them is how a site
served the wrong content for a week under a green tick. If you could not check,
say you could not check, and say why.

### 11. Spend context on thinking, not transport

If a tool returns tens of thousands of characters and you need three fields,
change channel: a targeted API, a `git` command, a filter. Poll the cheapest
thing that answers the question — watching for a commit with `git fetch` beats
re-listing every workflow run. And do not re-read what you already established;
re-deriving context is the quiet way a long session runs out of room to think.

---

## Choosing the work

### 12. Pick projects where checking an answer is far cheaper than producing one

This is the single best predictor of whether a project like this will go well,
and it is not the same as "is it a data project".

Over one day I was wrong about: NaN handling, a performance "fix" that saved no
money, a row count (11 vs 19), a join specification that would have made things
seventy times worse, and whether a colleague's dataset was usable. Every one was
disproved in seconds by running a query.

The project never required anyone to be right. It required them to be
**checkable**, which is a far weaker demand. Domains where verification costs
about the same as production — strategy, design, most prose — do not get this
and feel like wading by comparison.

### 13. Well-curated source data is worth more than clever processing

Dove's Guide, the CCCBR Methods Library and BellBoard have been maintained by
people who cared, for decades. That is why `dove-tower-id` exists at all.

**Three separate times a task was planned around inference the source already
answered:**

| Planned as hard | Actually |
| --- | --- |
| Match BellBoard performances to towers by name | BellBoard publishes `dove-tower-id`; ~94% carry it, 99.5% resolve |
| Classify methods into families | The library states `<classification>` on every method set |
| Group methods into naming families | `methods.name` is already a column |

Each was caught by looking at the data before writing the brief. The habit is
now a standing instruction to every agent: **confirm the gap is real before
filling it, and say so.**

---

## Working with multiple agents

### 14. Give an agent an oracle, not just a warning

The clearest result of the day. Two agents, comparable capability, opposite
outcomes:

- **Gemini** was given 1,851 labelled rows and told to score against them before
  trusting itself. Its work held up.
- **Mistral** was given a written warning that the source truncates silently,
  and no way to measure whether it had been truncated. Its backfill captured
  **55,000 rows of a 336,654-row corpus — 16% — and reported success.**

The instrument that would have caught it existed the whole time: BellBoard's
`search.php` reports a result count for any window, in one request. Nobody found
it until the failure had to be adjudicated.

**A brief that names a hazard without supplying the measurement is close to
useless.** If you cannot describe how the agent will know it succeeded, the task
is not ready to hand over.

### 15. Resolve disagreements by measuring, not by arbitrating

When two agents reported counts differing by seven times, the temptation was to
reason about which was more credible. Three HTTP requests settled it instead:
2023 held 25,859 performances, 2024 held 25,267, the full period 336,654.

Cost: about a minute. **When two agents disagree about a quantity, go and
measure the quantity.**

### 16. Boundaries exist so agents can run at once — say them explicitly

The first PR did both agents' briefs in one branch. The work was fine, but it
defeated the point of splitting them. Every brief now carries an explicit "do
not take on the other agent's task", plus a list of files not to touch.

### 17. Give each agent a queue, not a task

Single tasks mean an agent stalls waiting for a new brief. A numbered roadmap —
one task fully specified, the rest deliberately sketched — keeps work flowing.
Sketch the later ones thinly: three tasks here were rewritten or dropped once
the earlier work revealed the source already answered them.

### 18. An agent's data can be right while its prose is invented

A resolution write-up cited "Claremont, TowerID 1563" (does not exist) and
"Lismore, TowerID 10769" (actually Burnham on Crouch, Essex). **The CSV rows
were correct throughout** — only the narrative was wrong, which made the
document read as authoritative while being partly fabricated.

Treat generated prose and generated data as separately trustworthy. Verify every
identifier that appears in a sentence.

### 19. Insist on the whole confidence scale

That same run emitted no `low` band at all, collapsing four levels to three, and
two rows marked `high` were wrong. Since adjudication samples rather than
checking every row, an over-confident row does more damage than an honestly
uncertain one. Ask for calibration explicitly, and check the distribution.

---

## Working with data

### 20. Local testing is weaker than production testing — find out how

Three bugs here were invisible locally and appeared only against the hosted
database:

| Bug | Why local missed it |
| --- | --- |
| NaN never converted to NULL | SQLite silently stores NaN as NULL; the server rejects it |
| Double-quoted SQL string literal | stdlib `sqlite3` accepts it as a string; libSQL rejects it as an identifier |
| `executemany()` at 4.1 rows/s, then stalling | It is a network round-trip problem; there is no network locally |

Two of the three vanished by using **the same client library locally as in
production** — an embedded libSQL connection rather than stdlib `sqlite3`. That
one change turned local testing from an approximation into a real check.

Where a gap remains, write it down rather than claiming coverage you do not
have.

### 21. Latency and cost are different problems, and only one is visible

A batch update took 18 minutes. Batching it into a single statement brought it
to 19 seconds, and it was reported as fixed.

**It read exactly the same 139 million rows.** The metered cost — the thing that
actually mattered — was unchanged. A day's usage hit 591 million row reads
against a database holding 130,000 rows, from two statements that both looked
ordinary.

On any metered system, check the plan (`EXPLAIN QUERY PLAN`) and not the
stopwatch. A `SCAN` inside a correlated subquery means you are paying the
product of two tables.

### 22. A wrong identifier is worse than a missing one

Adjudicating 5,728 tower matches, the operating rule was that a NULL is visibly
unresolved and invites another pass, while a plausible-but-wrong ID silently
corrupts every downstream query and is very hard to notice later.

That justified rejecting 240 matches where the resolver had picked a tower in a
multi-tower town with **no building name to go on** — a guess dressed as a
match. Rejected rows keep their candidates on file, so "rejected" means "not
asserted", not "discarded".

### 23. Check the obvious fix before recommending it

`dove.TowerID` is not unique, so joins fan out. The obvious remedy — "join the
superset table instead" — turned out to inflate results by **1,439 rows against
the 19 it was meant to fix**, because that table is not unique either.

The same investigation found the join was also silently *dropping* 160 records,
which mattered more than the duplication and would never have surfaced from
de-duplication alone. Verify the fix on real data before writing it into a spec.

### 24. Third-party APIs lie in ways that look like success

BellBoard answers sustained querying by truncating the response body and
returning HTTP 200. A run that stops at 16% is byte-for-byte indistinguishable
from one that finished.

Assume any undocumented API throttles. Rate-limit from the start, cache to disk,
and build a completeness check — an expected count from an independent
endpoint — rather than trusting the absence of an error.

Also: the docs are often wrong about themselves. BellBoard's `export.php`
honours `from`/`to`; the plausible-looking `date_from`/`date_to` silently return
zero rather than erroring.

---

## Keeping the work

### 25. Commit the recipe, not the output

What belongs in the repository is whatever cannot be regenerated: schema,
loaders, and every adjudication decision with its reasoning. Raw sources are
re-downloadable and the assembled database rebuilds in 90 seconds, so neither
needs committing.

A 40 MB database *was* committed here, for the defensible reason that the live
one was frozen. It was removed a few hours later — it was heading for GitHub's
100 MB limit, and a binary that changes wholesale on each rebuild stays in git
history forever. Use a Release asset if a large file genuinely needs sharing.

### 26. Recorded SQL must be the SQL that runs

A `queries/` folder that duplicates the real queries is worse than none: it
looks authoritative while going stale. The build script here reads those files
at build time, so the recorded query and the executed query cannot diverge.

### 27. Write decisions down with the numbers in them

Short decision records — the problem, what was measured, what was chosen, what
the acceptance test is — did more good than any amount of code comments. They
also make delegation possible: a spec with an exact expected row count can be
handed to an agent and verified on return.

### 28. Dual-license data and code separately, explicitly

The code here is MIT; the data is CC BY-SA 4.0, inherited from Dove's Guide.
Putting data into an MIT repository does not relicense it, and share-alike
travels with anything substantially derived. Say so in a file next to the data,
including the attribution and the note that changes were made.

---

## The honest summary

None of this made the work error-free. The corpus day alone produced three
production-only bugs, a 591-million-read day, a failed backfill, a decision spec
that had to be corrected before anyone implemented it, and two rounds of rework
on the agent split.

What that setup did was make every one of those **visible and recoverable within
minutes**. That is the property worth reproducing — not the absence of mistakes,
but the speed at which they surface.

The earlier build is the same lesson stated in the negative. Its mistakes were
not larger; they were *quieter*. A site served the wrong content for a week, a
config was silently corrupt for as long, and a heuristic absorbed a day of
tuning before being replaced in twenty minutes. Nothing there was hard to fix
once seen. Everything there was hard to see.

So the two halves of this file are one lesson: **build the instrument that says
you are wrong, before you need it.** Lessons 1–11 are what it costs when there
isn't one. Lessons 12–28 are what becomes possible when there is.

---

## Where these live

A lesson only pays for itself if it is read at the moment it applies, which is
never the moment someone opens a lessons file. So the ones with a trigger — a
recognisable situation an agent can be told to watch for — are installed as
skills:

| Skill | Lessons | Triggered by |
| --- | --- | --- |
| [`verify-what-ships`](.claude/skills/verify-what-ships/SKILL.md) | 1–5 | About to claim a deployed page works |
| [`changing-course`](.claude/skills/changing-course/SKILL.md) | 6–11 | A fix has not worked twice; adding parameters |
| [`briefing-agents`](.claude/skills/briefing-agents/SKILL.md) | 13–19 | Writing a brief; reviewing what came back |
| [`data-plumbing`](.claude/skills/data-plumbing/SKILL.md) | 20–28 | Third-party APIs, metered databases, joins |

For **Claude apps** rather than Claude Code, the same material is packaged as a
single skill in [`dist/chat-skill/`](dist/chat-skill/) — lessons 1–28 minus 12,
reorganised around what they have in common instead of by which build paid for
them. A chat turn rarely announces which of four situations it is, so four
competing descriptions trigger worse there than one.

**Lesson 12 is deliberately not a skill.** Which projects to take on is decided
before any agent is running, by a person, and a skill that fires at the wrong
moment is worse than a file nobody opens. The same goes for the summary above —
it is an argument, not a procedure, and procedures are the only thing a skill
should carry.
