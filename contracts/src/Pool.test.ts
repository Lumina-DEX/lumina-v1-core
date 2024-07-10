import { Account, AccountUpdate, Bool, Field, Mina, PrivateKey, PublicKey, TokenContract, UInt64 } from 'o1js';

import { Pool, minimunLiquidity } from './Pool';
import { TestToken } from './TestToken';
import { TokenHolder } from './TokenHolder';

let proofsEnabled = false;

describe('Pool', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Pool,
    zkToken0Address: PublicKey,
    zkToken0PrivateKey: PrivateKey,
    zkToken0: TestToken,
    zkToken1Address: PublicKey,
    zkToken1PrivateKey: PrivateKey,
    zkToken1: TestToken,
    tokenHolder0: TokenHolder,
    tokenHolder1: TokenHolder;

  beforeAll(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Pool(zkAppAddress);

    zkToken0PrivateKey = PrivateKey.random();
    zkToken0Address = zkToken0PrivateKey.toPublicKey();
    zkToken0 = new TestToken(zkToken0Address);

    zkToken1PrivateKey = PrivateKey.random();
    zkToken1Address = zkToken1PrivateKey.toPublicKey();
    zkToken1 = new TestToken(zkToken1Address);

    if (proofsEnabled) {
      console.time('compile token');
      const tokenKey = await TestToken.compile();
      console.timeEnd('compile token');
      console.time('compile pool');
      const key = await Pool.compile();
      console.timeEnd('compile pool');
      console.log("key pool", key.verificationKey.data);
      console.log("key pool hash", key.verificationKey.hash.toBigInt());
    }


    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 3);
      await zkApp.deploy();
      await zkToken0.deploy();
      await zkToken1.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey, zkToken1PrivateKey]).send();

    tokenHolder0 = new TokenHolder(zkAppAddress, zkToken0.deriveTokenId());
    tokenHolder1 = new TokenHolder(zkAppAddress, zkToken1.deriveTokenId());

    const txn2 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2);
      await tokenHolder0.deploy();
      await tokenHolder1.deploy();
      await zkToken0.approveAccountUpdate(tokenHolder0.self);
      await zkToken1.approveAccountUpdate(tokenHolder1.self);
    });
    await txn2.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn2.sign([deployerKey, zkAppPrivateKey]).send();

  });

  // it('create pool', async () => {
  //   // mint token to user
  //   await mintToken();

  //   showBalanceToken0();
  //   showBalanceToken1();

  //   let amt = UInt64.from(10 * 10 ** 9);
  //   const txn = await Mina.transaction(senderAccount, async () => {
  //     AccountUpdate.fundNewAccount(senderAccount, 3);
  //     await zkApp.createPool(zkToken0Address, zkToken1Address, amt, amt);
  //   });
  //   await txn.prove();
  //   await txn.sign([senderKey]).send();

  //   showBalanceToken0();
  //   showBalanceToken1();

  //   const liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
  //   const expected = amt.value.add(amt.value).sub(minimunLiquidity.value);
  //   console.log("liquidity user", liquidityUser.toString());
  //   expect(liquidityUser.value).toEqual(expected);
  // });

  it('swap tokens', async () => {
    // mint token to user
    await mintToken();

    let amt = UInt64.from(10 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.createPool(zkToken0Address, zkToken1Address, amt, amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    showBalanceToken0();
    showBalanceToken1();
    let amtSwap = UInt64.from(1 * 10 ** 9);
    const txn2 = await Mina.transaction(senderAccount, async () => {
      // AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.swapExactAmountIn(zkToken0Address, amtSwap, UInt64.from(1));
    });
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    showBalanceToken0();
    showBalanceToken1();
  });

  function showBalanceToken0() {
    let bal = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
    console.log("balance user 0", bal.toBigInt());
    return bal;
  }

  function showBalanceToken1() {
    let bal = Mina.getBalance(senderAccount, zkToken1.deriveTokenId());
    console.log("balance user 1", bal.toBigInt());
    return bal;
  }

  async function mintToken() {
    // update transaction
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkToken0.mintTo(senderAccount, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([senderKey, zkToken0PrivateKey]).send();

    const txn2 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkToken1.mintTo(senderAccount, UInt64.from(1000 * 10 ** 9));
    });
    await txn2.prove();
    await txn2.sign([senderKey, zkToken1PrivateKey]).send();
  }

});