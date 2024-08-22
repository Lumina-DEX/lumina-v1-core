# Rollup solution

## Why

If we want to implement a dex that allows onchain swaps on mina, we'll need to generate proofs with the various information required for the swap, the amount the user swaps, the amount of reserves in the pool, the amount the user receives.

The problem is that between the time the user creates his proof and the time it is verified onchain, the pool reserves may have changed, making the proof no longer valid, which happens when several users swap on the same pool at the same time.

The solution would be to manage these swaps offchain, the only part that would be onchain would be the deposit of token/mina and the withdrawal of this, moreover with this kind of solution the user wouldn't have to wait for the block to be mined for his swap to be validated.

Of course, these swaps will be validated by proofs and their results regularly recorded onchain.

## Limitations of this solution

Swaps are managed offchain, but require a proof of deposit that can only be made onchain, and the user may have to create an account for these deposits, so for a deposit to be taken into account it may take several blocks, including a fairly long time on Mina, on Zeko this time may be a few seconds or a few minutes at most.

This solution requires a server powerful enough to create proofs and with an uptime of practically 100%. In addition, every interaction with the rollup must be saved (ipfs/database ...), so that the current state of the rollup can be reconstructed at any time.

## Advantages of this solution

This solution will allow the user to make swaps only with a signature of his wallet, allowing better accessibility especially from mobile as the generation of proof will not be necessary, it remains at least necessary to deposit or withdraw his tokens.

Swaps can be validated in seconds, whereas onchain it could take several minutes.

## How it works

### Deposit

For a deposit to be effective, it requires the existence of a global deposit contract and a unique contract for each user where their deposits will be recorded, this second contract will only be deployed at the first use by an account.

Once the deposit is effective onchain, our rollup will take it into account and integrate it into its state and validate its new state onchain, which requires at least 2 blocks for a deposit to be accessible in the dex.

![Deposit schema](https://github.com/Lumina-DEX/lumina-mvp/blob/rollup/deposit.png?raw=true)

