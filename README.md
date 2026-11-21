# World News — 20 November 2026

[![news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/Ladangcuan578/news-image-20-nov-2026/rank.svg)](https://make.fun/bounty/news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/Ladangcuan578/news-image-20-nov-2026/reward.svg)](https://make.fun/bounty/news-image-20261120)

One image that sums up Friday 20 November 2026's world news, for make.fun's
[“Sum up 20 November's world news in one image”](https://make.fun/bounty/news-image-20261120)
bounty.

## The image

A front-page newspaper layout, drawn entirely by the program:

- **Hero — Cyclone Akvan makes landfall on India's east coast** near Gopalpur:
  winds 70–80 kmph, gusts to 90; 300,000+ people evacuated, 423 rescue teams
  deployed, 69 trains cancelled; red alerts in Srikakulam and Vizianagaram.
- **EU summons Russia's envoy** after embassies were damaged in strikes on Kyiv
  (Kaja Kallas, 19 Nov); the Netherlands summoned its ambassador too.
- **Europe demands a seat at the Ukraine peace talks** — Berlin summit of the
  Coalition of the Willing, 25+ leaders from about 37 countries, plus US envoys
  Witkoff and Kushner; a four-party format backed, no date or venue agreed; the
  EU proposed a 45 billion euro loan.
- **After the Shenzhen summit**: Trump, Xi and Putin met about 90 minutes — no
  direct breakthrough, but a joint peace declaration and an extended US–China
  trade truce; Putin invited European diplomats to Moscow.
- **Anthropic shares jump 17%** in their Nasdaq debut, closing at about $97.
- **Also today**: Ukraine fired about 1,200 drones at Russia overnight; Houthis
  claim strikes on 4 targets in Saudi Arabia; the ICJ Myanmar ruling is final
  (9–6, no appeal); GTA VI rollout continues; Voyager 1 reaches one light-day
  from Earth; Fed minutes point to further rate hikes.

Every fact comes from the verified briefing the entry was built from; nothing
was invented, and scheduled events are worded as happening, never as decided.

## How it is made

`main.ts` (Node 22, standard library only) draws the whole page procedurally —
its own 5×7 bitmap font, its own minimal PNG writer (zlib DEFLATE) — and writes
`/output/entry.png` (1024×1024, under 1 MiB). No network, no dependencies, no
clock, no randomness: two runs produce byte-identical output.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
