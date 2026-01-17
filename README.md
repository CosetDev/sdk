# Coset SDK

Coset SDK is a TypeScript library for **data requesters** to interact with Coset oracles programmatically. It simplifies reading oracle data, handling paid updates (via x402), and receiving update results.

## Install

```bash
npm install @coset-dev/sdk
```

or

```bash
pnpm add @coset-dev/sdk
```

## Quickstart

```ts
import { Coset, Networks, PaymentToken } from "@coset-dev/sdk";

const coset = new Coset(
  Networks.MANTLE_TESTNET,
  PaymentToken.USDC,
  "0xabc...", // Oracle address
  process.env.PRIVATE_KEY as `0x${string}` // Wallet private key
);
```

## Read data

```ts
const res = await coset.read();

if (res.message) {
  console.error("Read failed:", res.message);
} else {
  console.log("Data:", res.data);
  console.log("Last update:", res.lastUpdateFormatted);
  console.log("Is update recommended?", res.isUpdateRecommended);
}
```

### Strict vs non-strict reads

- `coset.read(false)` (default) calls the node path `get-data-without-check`
- `coset.read(true)` calls the node path `get-data`

### Important: `read()` does not reject

Unlike most SDK methods, `coset.read()` typically **resolves** even when the node call fails (often with `{ message: string, data?: any }`). Check `res.message` as shown above.

## Update data (paid)

Coset updates are **paid** operations. The SDK settles payment via x402, then submits the update to a Coset node.

You need:

- a wallet private key (for signing)
- sufficient `USDC` or `CST` on the selected network

```ts
const update = await coset.update();

console.log("Spent:", update.spent.total);
console.log("Tx:", update.tx);
console.log("Data:", update.data);
```

### Spending limits

```ts
await coset.setSpendingLimit(5);

// Later...
await coset.update();
```

If `coset.spent >= coset.spendingLimit`, `update()` rejects with:

```ts
{
  message: "Spending limit exceeded",
  spent: { total: 0, gasFee: 0, platformFee: 0, dataProviderFee: 0 },
}
```

To bypass this guard:

```ts
await coset.update({ force: true });
```

### Optional update

If you only want to update when recommended:

```ts
const needed = await coset.isUpdateNeeded();
if (needed) await coset.update();
```

Or use `coset.optionalUpdate()` (it returns `null` even if it performs an update).

## Networks & payment tokens

Supported:

- Networks: `mantle`, `mantle-testnet`
- Payment tokens: `USDC`, `CST`

Token addresses are resolved internally based on the selected `Networks` + `PaymentToken` combination (see the API reference in the docs).

## Docs

You can learn everything about Coset SDK at [developer documentation](https://docs.coset.dev/sdk).