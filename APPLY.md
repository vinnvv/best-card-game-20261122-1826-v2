# Scaffold staging for best-card-game-20261122-1826

Prepared 2026-11-22 21:4x WIB, BEFORE the competition opens. `init` refuses until
opening (23 Nov 01:26 WIB, drand round 34189532), so nothing here is committed yet.

## Apply (post-opening build session, after 01:26 WIB 23 Nov)

```sh
cd ~/workspace/makefun/best-card-game-20261122-1826
node ~/workspace/makefun/best-card-game-20261122-1826-kit/best-card-game-20261122-1826-kit/cli/makefun.mjs init --license MIT --keypair ~/.makefun/keypairs/https_make.fun.json
# init prints: makefun anchor <root sha> round <round>  (must appear in that session's tool results BEFORE its first counted write: thinking_fresh)
cp -r ~/workspace/makefun/best-card-game-20261122-1826-scaffold/. .
git add -A && git commit -m "scaffold: kit starter layout, README badges, placeholder game"
```

## Contents

- `main.ts`, `vendor/makefun-game.ts`, `serve.ts`, `shots.json`: verbatim copies of the kit starter
  (sha256 matches kit.json: main.ts 98e7342e..., vendor dc671875...). Starter lines are excluded
  from the transcript gate's counted lines, but the build agent should still write/revise main.ts
  itself for clean authorship.
- `README.md`: 3 live make.fun badges (owner vinnvv, repo best-card-game-20261122-1826).
  Fix the repo name if the GitHub repo ends up named differently. The build agent should write
  the final README itself (a file only copied in counts as unwritten under thinking_reproduces).
- `game/index.html`: minimal placeholder only. The build agent writes the real game from scratch
  (game/src/ is empty and ready). Do NOT ship the starter game: its dossier is byte-for-byte
  house game 2 and would share that rate and never enter the playoff.
- `screenshots/`: empty, ready for the 3-4 real renders (first by name is the cover).

## Timing targets

- v1 submitted before round 1 judging: 23 Nov 04:26 WIB.
- Deadline: 23 Nov 13:26 WIB. Quota: 6/day effective, 6 left.
