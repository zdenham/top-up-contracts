# Top Up Contracts

Smart contracts to top up receiver wallet addresses once they get below a certain threshold.

## Motivation

Keeping large balance in custodial relayer accounts is not great security practice. If API keys or private keys are compromised, there is a risk of losing the whole gas sponsorship balance. Also, from tax perspective, it can be preferabe to not receive large lump sum of crypto, but only receive utility tokens as needed to accomplish the task at hand.

This smart contract allows for an automated process to drip funds to relayer wallets from a "paymaster" smart contract which no one owns only once relayer wallets drop below a certain threshold. This simplifies the tax implications and enhances the security of the relayer solution, and also reduces the operational overhead of coordinating multi-sig signers to top up relayers.

## Parameters

1. **withrawerAddress** - the address which can reclaim any leftover gas funds via `withdraw` function
2. **maxReceiverBalance** - if a receiver has a higher balance than this parameter, they cannot receive a top up. This keeps the receiver balances relatively low.
3. **topUpAmount** - the amount we top up a receiver once they get below the balance
4. **receiverAddress** - the list of eligible receivers (relayer accounts)

## Tests

1. `pnpm install`
2. `pnpm hardhat test`
3. `pnpm hardhat coverage` // should be 100%

## Threat model

1. An attacker might compromise the `withdrawAddress`.
2. An attacker might compromise a `receiveAddress` (or the relayer api key) and drain the balance one `topUp` at a time.
3. An attacker might try to circumvent validation on `withdraw` or `topUp` to send funds to their own account.

## Threat Mitigation

1. The `withdrawAddress` should be a secure multi-sig
2. Enforce relayer policy such that relayers can only interact with allowlisted addresses. Set up monitoring for high rate of top ups. Use KMS to store relayer API keys.
3. Acheive 100% test coverage