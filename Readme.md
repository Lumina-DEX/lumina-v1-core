# Lumina MVP

First iteration of LuminaDex, allows you to create Mina/Fungible Token pools.

Adding/withdrawing liquidities, or swapping, each action requires only one transaction.

These actions can be performed concurrently with other users.

## Licensing

Business Source License 1.1

Licensor: Lumina Labs

## Test

```
cd contracts
npm run testmina
```

docker run -it   --env NETWORK_TYPE="single-node"  --env PROOF_LEVEL="full"   --env LOG_LEVEL="Info"   -p 3085:3085  -p 5433:5432  -p 8080:8080 -p 8181:8181 -p 8282:8282 o1labs/mina-local-network:compatible-latest-devnet

## Lastest Improvment

Pool factory, to create only one pool by pair, avoids liquidity fragmentation.

0.1 % liquidity tax as protocol fees.

0.2 % fee tax as liquidity provider fees.

0.05 % fee tax as frontend provider fees (the frontend need only to pass his public key address to swap method to collect fees).

