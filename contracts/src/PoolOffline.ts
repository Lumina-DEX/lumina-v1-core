import { Account, AccountUpdate, Bool, Field, Mina, PrivateKey, PublicKey, TokenContract, UInt64 } from 'o1js';

import { PoolMina, TokenA, MinaTokenHolder, PoolDeployProps, TokenStandard, minimunLiquidity } from './index.js';

let proofsEnabled = true;

let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolMina,
    zkToken0Address: PublicKey,
    zkToken0PrivateKey: PrivateKey,
    zkToken0: TokenA,
    tokenHolder0: MinaTokenHolder;


if (proofsEnabled) {
    console.time('compile pool');
    await TokenStandard.compile();
    const tokenKey = await TokenA.compile();
    const key = await PoolMina.compile();
    await MinaTokenHolder.compile();
    console.timeEnd('compile pool');
}

const Local = await Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(Local);
[deployerAccount, senderAccount, bobAccount, aliceAccount] = Local.testAccounts;
deployerKey = deployerAccount.key;
senderKey = senderAccount.key;
bobKey = bobAccount.key;
aliceKey = aliceAccount.key;

zkAppPrivateKey = PrivateKey.random();
zkAppAddress = zkAppPrivateKey.toPublicKey();
zkApp = new PoolMina(zkAppAddress);

zkToken0PrivateKey = PrivateKey.random();
zkToken0Address = zkToken0PrivateKey.toPublicKey();
zkToken0 = new TokenA(zkToken0Address);

let deployData: PoolDeployProps = { tokenA: zkToken0Address };

const txn = await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount, 2);
    await zkApp.deploy(deployData);
    await zkToken0.deploy();
});
await txn.prove();
// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey]).send();

tokenHolder0 = new MinaTokenHolder(zkAppAddress, zkToken0.deriveTokenId());

const txn2 = await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount, 2);
    let account = AccountUpdate.create(senderAccount, zkApp.deriveTokenId());
    await tokenHolder0.deploy();
    await zkToken0.approveAccountUpdate(tokenHolder0.self);
    await zkApp.approveAccountUpdate(account);
});
await txn2.prove();
// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
await txn2.sign([deployerKey, zkAppPrivateKey]).send();

// mint token to user
await mintToken(senderAccount);


let amt = UInt64.from(10 * 10 ** 9);
const txn3 = await Mina.transaction(senderAccount, async () => {
    await zkApp.supplyLiquidityBase(amt, amt);
});
await txn3.prove();
await txn3.sign([senderKey]).send();

showBalanceToken0();
showBalanceToken1();
let amtSwap = UInt64.from(1 * 10 ** 9);
const txn4 = await Mina.transaction(senderAccount, async () => {
    //AccountUpdate.fundNewAccount(senderAccount, 2);
    await zkApp.swapFromMina(amtSwap, UInt64.from(1));
});
await txn4.prove();
await txn4.sign([senderKey]).send();

showBalanceToken0();
showBalanceToken1();

function showBalanceToken0() {
    let bal = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
    console.log("balance user 0", bal.toBigInt());
    return bal;
}

function showBalanceToken1() {
    let bal = Mina.getBalance(senderAccount);
    console.log("balance user 1", bal.toBigInt());
    return bal;
}

async function mintToken(user: PublicKey) {
    // update transaction
    const txn = await Mina.transaction(senderAccount, async () => {
        AccountUpdate.fundNewAccount(senderAccount, 1);
        await zkToken0.mintTo(user, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([senderKey, zkToken0PrivateKey]).send();

}