# Top Up Contracts

Smart contracts to top up receiver wallet addresses once they get below a certain threshold.

## Motivation

Keeping large balance in custodial relayer accounts is not great security practice. If API keys or private keys are compromised, there is a risk of losing the whole gas sponsorship balance. Also, from tax perspective, it can be preferabe to not receive large lump sum of crypto, but only receive utility tokens as needed to accomplish the task at hand.

This smart contract allows for an automated process to drip funds to relayer wallets from a "paymaster" smart contract which no one owns only once relayer wallets drop below a certain threshold. This simplifies the tax implications and enhances the security of the relayer solution.

## Parameters

1. **withrawerAddress** - the address which can reclaim any leftover gas funds via `withdraw` function
2. **maxReceiverBalance** - if a receiver has a higher balance than this parameter, they cannot receive a top up. This keeps the receiver balances relatively low.
3. **topUpAmount** - the amount we top up a receiver once they get below the balance
4. **receiverAddress** - the list of eligible receivers (relayer accounts)
