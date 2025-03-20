import { AccountUpdate, Mina, AccountUpdateForest, assert, Bool, Int64, method, Permissions, Provable, PublicKey, state, State, Struct, TokenContract, TokenId, Types, UInt64, VerificationKey, fetchAccount } from 'o1js';

const Network = Mina.Network({
    // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
    // This is to ensure the backward compatibility.
    networkId: "testnet",
    mina: "https://api.minascan.io/node/devnet/v1/graphql",
    archive: "https://api.minascan.io/archive/devnet/v1/graphql",
});

// const Network = Mina.Network(config.url);
const fee = Number(0.1) * 1e9; // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network);

const account = await fetchAccount({ publicKey: PublicKey.fromBase58("B62qq47Pu4rmDAs86jRLcwDRD3XDheJU9dmRq5pfSpfWYi2aY7b1KNH") })
const accountHolde = await fetchAccount({ publicKey: PublicKey.fromBase58("B62qq47Pu4rmDAs86jRLcwDRD3XDheJU9dmRq5pfSpfWYi2aY7b1KNH"), tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn" })

console.log(account.account.zkapp.verificationKey);
console.log(account.account.zkapp.verificationKey.hash.toJSON());

console.log(accountHolde.account.zkapp.verificationKey);
console.log(accountHolde.account.zkapp.verificationKey.hash.toJSON());
