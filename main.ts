// One-shot rally rider for CBBTC (1-minute bars, $1,000 paper).
//
// The bot reads one bar per batch, keeps every CBBTC close it has seen, and
// trades at most once per window: a single full-size entry on a confirmed
// short-term rally, then one whole-position exit on a trailing stop or a
// give-up signal. No re-entry after any exit, no orders during warm-up, and
// at most one order in any reply.
//
// Entry (once, full cash, only while seq is 120..1200 and holding nothing):
//   close above the 120-bar simple moving average of closes, AND the 30-bar
//   return above +0.6%. The buy is decided on this bar's close and fills at
//   the next bar's open.
// Exits (whole position, either one):
//   trailing stop: close below 98% of the peak close since entry;
//   give-up: the 240-bar return below -1.5% (a sustained downtrend).
//
// All comparisons are exact bigint arithmetic on the raw close units, so the
// same bars give the same orders on every run: no clock, no randomness, no
// environment reads, no floats anywhere in the decision path.

import { runBars, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const MAX_SLIPPAGE_BPS = 100;

/** Entry window on the batch seq: late enough for SMA(120) to exist, early enough to leave room. */
const ENTRY_FIRST_SEQ = 120;
const ENTRY_LAST_SEQ = 1200;
/** SMA length, in bars. */
const SMA_BARS = 120;
/** Momentum lookback, in bars, and its trigger: return above +0.6%. */
const MOMENTUM_BARS = 30;
const MOMENTUM_NUM = 1006n;
const MOMENTUM_DEN = 1000n;
/** Trailing stop: exit when close falls below 98% of the peak since entry. */
const TRAIL_NUM = 98n;
const TRAIL_DEN = 100n;
/** Give-up lookback, in bars, and its trigger: return below -1.5%. */
const GIVE_UP_BARS = 240;
const GIVE_UP_NUM = 985n;
const GIVE_UP_DEN = 1000n;

/** Every CBBTC close seen so far, in batch order. */
const closes: bigint[] = [];
/** True once the single entry has actually filled (a position was seen). */
let entered = false;
/** True once the single exit has been decided: no re-entry after it. */
let exited = false;
/** Highest close seen since the entry was decided; null while flat. */
let peak: bigint | null = null;

await runBars({
  onBatch(state: BarsState, batch) {
    for (const bar of batch.bars) {
      if (bar.symbol === SYMBOL) closes.push(BigInt(bar.c));
    }
    if (state.warmingUp) return [];

    const n = closes.length;
    if (n === 0) return [];
    const close = closes[n - 1]!;
    const held = state.positions.get(SYMBOL);

    if (held !== undefined) {
      entered = true;
      if (peak === null || close > peak) peak = close;
      const trailing = close * TRAIL_DEN < peak * TRAIL_NUM;
      const giveUp = n > GIVE_UP_BARS && close * GIVE_UP_DEN < closes[n - 1 - GIVE_UP_BARS]! * GIVE_UP_NUM;
      if (trailing || giveUp) {
        exited = true;
        peak = null;
        const sell: SellInput = { side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS };
        return [sell];
      }
      return [];
    }

    // Flat. If a buy was decided but the market refused it (a rejected fill
    // leaves no position), the entry may be tried again while its signal
    // still holds; once an exit has been decided there is no re-entry.
    if (entered || exited) return [];
    if (state.seq < ENTRY_FIRST_SEQ || state.seq > ENTRY_LAST_SEQ) return [];
    if (n <= SMA_BARS) return [];

    let sum = 0n;
    for (let i = n - SMA_BARS; i < n; i++) sum += closes[i]!;
    const aboveSma = close * BigInt(SMA_BARS) > sum;
    const momentum = n > MOMENTUM_BARS && close * MOMENTUM_DEN > closes[n - 1 - MOMENTUM_BARS]! * MOMENTUM_NUM;
    if (!aboveSma || !momentum) return [];

    peak = close;
    const buy: BuyInput = { side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS };
    return [buy];
  },
});
