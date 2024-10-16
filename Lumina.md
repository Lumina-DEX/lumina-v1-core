# Luminadex

## Decentralization

Smartcontracts are hosted directly on the Mina blockchain and do not require an intermediary to be executed.

It is based on a model of transaction fees attributed to the various players enabling this dex to function: 
- 0.25% for liquidity providers  
- between 0-0.15% for frontend operators, allowing free competition between them  
- 0.05% for Lumina as creator and maintainer of the protocol  

It is completely permissionless, these access methods are public and require no special rights to add/withdraw liquidities, swap or create a pool.

## One transaction

Whether it's creating a pool, adding or withdrawing liquidity or swapping, each of these actions requires just a single transaction.

What's more, a slippage has been implemented to enable several users to perform these actions at the same time on the same pool without potentially seeing their transaction fail.

## Fungible Token Standard

This dex respects the [standard fungible token](https://github.com/o1-labs/rfcs/blob/main/0014-fungible-token-standard.md) and therefore allows Mina/Fungible token pools to be created.


## Multichain

The smartcontracts were created with o1js and support all chains compatible with this library, including Mina & Zeko.

## Architecture

The protocol is currently based on 4 contracts :  
- PoolData, this contract contains various information shared between pools, such as the current address of the protocol collector, and the user authorized to update contracts in the event of a necessary security update  
- PoolFactory, this contract enables liquidity pools to be deployed, and ensures that there is only one pool per pair of tokens, thus avoiding liquidity fragmentation
- PoolMina & PoolTokenHolder the core contracts who manage liquidity/swap, these are the 2 contracts deployed by poolfactory






