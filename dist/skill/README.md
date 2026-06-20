# Portable Tunnel skill

A thin, copy-anywhere version of the `tunnel-aesthetic` skill. It links the
shared assets from the CDN and points at the canonical brief, so it stays in
sync instead of becoming a stale fork. Copy the **folder** so the skill is named
`tunnel-aesthetic/`.

## Where to put it

| You're using…                          | Install location                                      | Scope                                  |
|----------------------------------------|-------------------------------------------------------|----------------------------------------|
| Claude Code in the **terminal**        | `~/.claude/skills/tunnel-aesthetic/SKILL.md`          | every local session, every repo        |
| Claude Code on the **web** — per repo  | `.claude/skills/tunnel-aesthetic/SKILL.md` (committed)| any web session on that repo           |
| Claude Code on the **web** — per env   | environment **Setup script** writes it (see below)    | every session in that environment      |

Remember: a web/cloud session runs in a fresh VM and only sees what's **in the
repo** or placed by the **environment setup script** — it never reads your
laptop's `~/.claude`.

## Quick install

Local terminal:

```bash
mkdir -p ~/.claude/skills/tunnel-aesthetic
curl -fsSL https://cdn.jsdelivr.net/gh/nihilisticiconoclast/cuddly-lamp@main/dist/skill/SKILL.md \
  -o ~/.claude/skills/tunnel-aesthetic/SKILL.md
```

Web — per repo: copy this folder to `.claude/skills/tunnel-aesthetic/` and commit it.

Web — environment setup script (use the **raw GitHub** URL; jsDelivr is not on
the cloud allowlist by default):

```bash
mkdir -p ~/.claude/skills/tunnel-aesthetic
curl -fsSL https://raw.githubusercontent.com/nihilisticiconoclast/cuddly-lamp/main/dist/skill/SKILL.md \
  -o ~/.claude/skills/tunnel-aesthetic/SKILL.md
```

The page's own `tokens.css` / `tunnel-figure.js` always come from the jsDelivr
`<link>`/`<script>` (that loads in the end user's browser, where jsDelivr is
fine).
