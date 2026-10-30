# Tilt Tamer

A preflop poker trainer. Drill 6-max 100bb **open-raise (RFI)** decisions: get a random hand and position, choose Fold or Raise, and see whether you were right, the action frequencies, and the position's 13×13 range.

> **Simplified ranges, not solver output.** The ranges are generated from the Chen formula (see `RANGES.md`). They're a teaching baseline, not GTO.

**Live:** https://shaokiat.github.io/tilt-tamer/

## Run

```bash
npm install --include=dev   # --include=dev in case your npm config omits dev deps
npm run dev                 # http://localhost:5173
npm test                    # Vitest: invariants, scoring, deal distribution, stats
npm run generate            # regenerate src/data/ranges.json from RANGES.md §3
npm run build               # typecheck + production build
npm run deploy              # build and publish dist/ to the gh-pages branch (GitHub Pages)
```

## Controls

| Key | Action |
|---|---|
| `F` | Fold |
| `R` | Raise |
| `Space` / `Enter` | Next hand |

Toggles: **Study mode** shows the range before you answer. **Auto-advance** moves to the next hand 1.2s after a Perfect answer.

## How it works

| File | Role |
|---|---|
| `scripts/generate-ranges.ts` | Writes `src/data/ranges.json` (committed). Ranges live in data, not code. |
| `src/lib/chen.ts` | Chen score + tie-break ordering (RANGES.md §3.2) |
| `src/lib/generate.ts` | Walks hands strongest-first to each target %; the boundary class gets a fractional frequency (§3.3) |
| `src/lib/scoring.ts` | Pure `scoreAnswer`: correct if freq ≥ 0.20, perfect if it's the top action (§4) |
| `src/lib/deal.ts` | Deals two distinct cards from a 52-card deck, so every one of the 1326 combos is equally likely |
| `src/lib/stats.ts` | Accuracy overall / by position / by category; the 5 weakest (position, category) pairs with ≥ 5 attempts |
| `src/lib/storage.ts` | localStorage persistence, validated on load |
| `src/components/*` | React UI |

**Scoring:** Perfect counts as correct. Accuracy = (correct + perfect) / attempts. If an action is at exactly 50%, both buttons score Perfect.

**Nesting:** UTG ⊆ HJ ⊆ CO ⊆ BTN holds because every position uses the same ordering. SB (40%) sits outside that chain, as RANGES.md §6.3 implies.

## Tests (RANGES.md §6)

| Invariant | Test |
|---|---|
| 1. 169 classes, freqs in [0,1], raise+fold=1 | `tests/ranges.test.ts` |
| 2. raise % within 0.5 of target | `tests/ranges.test.ts` |
| 3. Nesting UTG ≤ HJ ≤ CO ≤ BTN | `tests/ranges.test.ts` |
| 4. Pair monotonicity | `tests/ranges.test.ts` |
| 5. Suited ≥ offsuit | `tests/ranges.test.ts` |
| 6. Combo counts 6/4/12, total 1326 | `tests/ranges.test.ts` |
| 7. Grid layout | `tests/ranges.test.ts` |
| Committed JSON matches the generator | `tests/ranges.test.ts` |
| 1000 deals stay within the 169 classes; 6:4:12 per-class ratio | `tests/deal.test.ts` |
| Scoring thresholds, ties, float noise | `tests/scoring.test.ts` |
| Chen spot values and ordering | `tests/chen.test.ts` |
| Stats, leaks, storage robustness | `tests/stats.test.ts` |

## Known limitations

From RANGES.md §7: Chen is a heuristic and misranks some hands (it opens 76s from UTG, for example). SB plays raise-or-fold. RFI spots only.
