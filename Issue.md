## Actual implementation issue

### Swap amount out

When you swap (or add liquidity), the calculation of the outgoing amount is based on the reserves. If several people swap on the same block, the first proof will modify the pool's reserves, invalidating the amounts calculated for the other proofs.

#### Possible solution

Instead of calculating an exact amount out, calculate an amount out based on slippage that is lower than the real amount, and then allow the user to claim any tokens remaining in the pool. 