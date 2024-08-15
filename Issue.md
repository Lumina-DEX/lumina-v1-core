## Actual implementation issue

### Token standard compatibility

I've created my own token based on TokenStandard, which allows me to make mina/tokenstandard pools, this token being used in the smartcontract code of the dex, it seems that if another user creates his own token with a different code base from mine, although also based on TokenStandard, proof generation will fail on the dex, it is likely that when compiling the dex, it will use the verification key of the tokenstandard created for the occasion and that any token with a different verification key will not be able to be used, thus limiting its compatibility.

#### Possible solution

Instead of directly using the token implementation in the pool smartcontract, use accountUpdate instead, which may solve the problem.
(Need Some assistance from mina/o1js)

### Swap amount out

When you swap (or add liquidity), the calculation of the outgoing amount is based on the reserves. If several people swap on the same block, the first proof will modify the pool's reserves, invalidating the amounts calculated for the other proofs.

#### Possible solution

Instead of calculating an exact amount out, calculate an amount out based on slippage that is lower than the real amount, and then allow the user to claim any tokens remaining in the pool. 