# `paid-for-lessons` — the chat build

One cohesive document, for **Claude apps (claude.ai, desktop, mobile)** rather than Claude
Code. It carries the same material as the four repo skills, reorganised around the single
thing they have in common — *build the instrument that says you are wrong, before you need
it* — instead of being four documents in a trenchcoat.

It is a different build, not a copy, because the two surfaces behave differently:

| | Claude Code (`.claude/skills/`) | Claude apps (this folder) |
|---|---|---|
| How it triggers | four narrow descriptions, each matching a moment mid-task | one description, matched against a whole conversation |
| What it assumes | a repo, a shell, CI, a deploy target | none of that necessarily present |
| Best shape | four separate skills, so the right one fires and the others stay quiet | one document, because the situations blur together in conversation |

**Why not four skills here too.** In Claude Code a skill fires against a task in progress —
you are about to claim a deploy works, you have failed twice, you are writing a brief — so
narrow triggers are an advantage. A chat turn rarely announces itself that cleanly, and four
overlapping descriptions competing for the same conversation triggers worse than one, not
better. Hence one document with a stated throughline.

**Why the specifics are still in it.** Every rule keeps the number that bought it — 139
million rows, 16% of a corpus, 240 rejected matches, six CI rounds. A rule stated without its
evidence reads as generic advice and gets ignored; the number is what makes it land.

## Install

**claude.ai / desktop / mobile** — zip the `paid-for-lessons/` folder (the folder itself, not
its contents) and upload it at **Settings → Capabilities → Skills → Upload skill**:

```bash
cd dist/chat-skill && zip -r paid-for-lessons.zip paid-for-lessons
```

Skills require a paid plan, and the setting must be enabled for the workspace. Once uploaded
it applies to every conversation where the description matches — there is nothing to invoke by
hand.

**Claude Code**, if you want this version instead of the four narrow ones:

```bash
mkdir -p ~/.claude/skills/paid-for-lessons
curl -fsSL https://raw.githubusercontent.com/nihilisticiconoclast/cuddly-lamp/main/dist/chat-skill/paid-for-lessons/SKILL.md \
  -o ~/.claude/skills/paid-for-lessons/SKILL.md
```

Don't install both. They cover the same ground, and two skills describing the same situation
is exactly the ambiguity the split above is meant to avoid.

## Keeping it honest

This file duplicates prose that also lives in `.claude/skills/` and in `LESSONS.md`, which is
the failure mode lesson 26 warns about: a second copy that looks authoritative while going
stale. It is tolerable here only because these are prose and change rarely. If a lesson is
revised, revise it in `LESSONS.md` first — that is the source — and carry the change into both
skill builds in the same commit.
