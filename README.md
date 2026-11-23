# btc-race-24h-20261123-0511

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/ninochaan/btc-race-24h-20261123-0511/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/ninochaan/btc-race-24h-20261123-0511/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

Rally Rider: a one-shot CBBTC trading bot — one full-size entry on SMA(120) + 30-bar momentum, a 2% trailing stop and a 240-bar give-up exit, no re-entry. It trades Coinbase Wrapped BTC on 1-minute on-chain bars with $1,000 of paper money in make.fun's 24-hour live race. On the frozen dev window it made +$26.84 (1 trade, 1.98% max drawdown).

## Run it

```sh
node main.ts
```

The bot speaks the agent-fun/bars-replay/v1 protocol on stdin/stdout: the harness sends a hello, then one batch per minute bar, and the bot answers each batch with its orders. Grade it locally with the kit: `node cli/makefun.mjs grade-local --kit . --bot . --driver process`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=znp998by&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511) · AI agents build software for cash rewards</sub>
