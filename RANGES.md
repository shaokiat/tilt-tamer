# Range Reference (6-max, 100bb, cash)

> **Status: simplified, GTO-style approximation. NOT solver output.**
> Real GTO charts come from solvers (PioSolver, GTO Wizard, etc.) for a specific setup. The ranges generated from this document are a teaching baseline. The UI must label them "Simplified ranges". Swap in a trusted chart via `ranges.custom.json` (see SPEC.md, P2).

## 1. Assumptions

- Game: No-limit hold'em cash, 6-max, 100bb effective stacks.
- Scenario in scope: **open-raise (RFI)**, i.e. everyone before you has folded.
- Rake and antes ignored. Tournament/ICM out of scope.
- SB is modelled as **raise-or-fold** (no limping) to keep the drill binary.
- Positions: UTG, HJ, CO, BTN, SB. (BB has no RFI spot.)

## 2. Target opening frequencies (approximate)

Percent is of all 1326 starting combos.

| Position | Open % (target) | Commonly cited range |
|---|---|---|
| UTG | 16 | 15-18 |
| HJ  | 20 | 19-22 |
| CO  | 28 | 26-30 |
| BTN | 45 | 42-50 |
| SB  | 40 | varies a lot by strategy |

These are ballpark figures. Verify against a source you trust before presenting them as accurate.

## 3. Rule-based range generation

Goal: deterministic, reproducible ranges that **nest by construction** (anything opened from an earlier position is also opened from every later one).

### 3.1 Hand universe

169 hand classes, 1326 combos:
- Pairs (13 classes): 6 combos each.
- Suited (78 classes): 4 combos each. Notation `AKs`.
- Offsuit (78 classes): 12 combos each. Notation `AKo`.

### 3.2 Strength score (Chen formula)

For hand with high card H and low card L:

1. Points for high card: A=10, K=8, Q=7, J=6, T=5, 9=4.5, 8=4, 7=3.5, 6=3, 5=2.5, 4=2, 3=1.5, 2=1.
2. Pair: double the points, minimum 5.
3. Suited: +2.
4. Gap (number of ranks between the cards): 0 gap = 0, 1 gap = -1, 2 gap = -2, 3 gap = -4, 4+ gap = -5.
5. Straight bonus: +1 if gap is 0 or 1 and the high card is below Q (pairs excluded).
6. Round half-points up.

Tie-break ordering (descending): score, then pair > suited > offsuit, then high card rank, then low card rank.

### 3.3 Building a range for target T%

1. Sort the 169 classes by the ordering above, strongest first.
2. Walk the list accumulating combos until the total reaches `T% * 1326`.
3. The class that crosses the boundary gets a **fractional raise frequency** so the total equals the target exactly. Example: 5 combos still needed from a 12-combo offsuit class gives raise frequency 5/12, about 0.42.
4. Classes before the boundary: `raise = 1.0, fold = 0.0`. After: `raise = 0.0, fold = 1.0`.

Because every position uses the same ordering and targets increase (UTG < HJ < CO < BTN), nesting holds automatically. The test suite still verifies it.

## 4. Scoring rule for the drill

- User picks Fold or Raise for a (hand, position).
- **Correct** if the chosen action's frequency is >= 0.20.
- **Perfect** if the chosen action is the highest-frequency action.
- Feedback always shows the frequency of each action, e.g. "Raise 42% / Fold 58%".

## 5. Data schema

`ranges.json`:

```json
{
  "meta": { "source": "rule-generated", "stack": "100bb", "format": "6max-cash", "version": 1 },
  "RFI": {
    "UTG": { "AA": { "raise": 1.0, "fold": 0.0 }, "T9o": { "raise": 0.0, "fold": 1.0 } },
    "HJ": {},
    "CO": {},
    "BTN": {},
    "SB": {}
  }
}
```

All 169 hands present for every position. For each hand, `raise + fold = 1`.

## 6. Invariants to test

1. 169 classes per position; frequencies in [0, 1]; `raise + fold = 1`.
2. Combo-weighted raise % per position is within 0.5 of its target.
3. **Nesting:** for every hand, `raise(UTG) <= raise(HJ) <= raise(CO) <= raise(BTN)`.
4. Pairs: if 77 is opened, all higher pairs are opened at that position or with frequency at least as high.
5. Suited dominance: `raise(XYs) >= raise(XYo)` for the same ranks.
6. Combo counts: 6 / 4 / 12 per class; total 1326.
7. Grid layout: pairs on the diagonal, suited above, offsuit below.

## 7. Known limitations

- Chen is a heuristic, not equity or solver-based; it misranks some hands (e.g. it undervalues some suited connectors relative to solvers).
- No SB limping, no mixed strategies beyond the boundary hand.
- Only RFI. Facing opens, 3-bet pots and postflop are out of scope.
- GTO is a hard-to-exploit baseline, not the best strategy against a specific opponent.
