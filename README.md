[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/vinnvv/best-card-game-20261122-1826-v2/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/vinnvv/best-card-game-20261122-1826-v2/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# Arrowheart Duel

An original 3x3 spatial card battler built for the
[make.fun best card game bounty](https://make.fun/c/best-card-game-20261122-1826).
It runs offline in a desktop browser from static files under `game/`,
played with keyboard and mouse. No network request, no build step.

## The game

You duel Rook the Rival on a 3x3 felt field called the Heartfield. Each card
carries a power number and directional arrows. Place a card and every arrow
pointing at a weaker rival card captures it. Arrows touching a friendly card
of the same suit link for +1 power. When the field fills, the side holding
more cards deals damage equal to the difference. First duelist to 0 life
loses the duel.

Suits are told apart by colour and shape: Ember is red with a triangle,
Tide is blue with a circle, Leaf is green with a diamond, Stone is gold
with a square.

- Title screen, live table with both hands, readable values and suits,
  life totals, score and timer, plus win and loss screens.
- Short in-game tutorial, a one-click How to Play overlay, legal-move
  highlights, a hint line that names the rival move to block.
- Card slide, flip and snap animations, synthesized sound effects,
  keyboard shortcuts: keys 1-5 pick a card, arrow keys move the cursor,
  Enter places, Space ends the turn, H opens help, M toggles sound.

## Play

Serve `game/` locally and open it in desktop Chrome:

```sh
node serve.ts
```

Then open http://localhost:8080.

Staged screenshot scenes (real renders of the game's own code, same seed
every time) live behind `?shot=`:

- `?shot=cover` mid-play table, one card lifted and glowing
- `?shot=title` title screen
- `?shot=win` victory screen
- `?shot=loss` defeat screen

## Hand in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored make.fun
library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/` - the playable game as static files (`index.html`, `src/table.css`
  and the `src/` modules: config, deck, rules, game-state, ai-opponent,
  render-table, animations, sound, shots, main)
- `screenshots/` - 4 real renders of the game (first by name is the cover)
- `main.ts` - the entry program
- `vendor/makefun-game.ts` - the kit's dossier library, unchanged
- `serve.ts` - a tiny static server for local play-testing
- `shots.json` - the screenshot shot definitions
