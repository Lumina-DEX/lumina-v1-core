import { Account, AccountUpdate, Bool, Field, Mina, PrivateKey, PublicKey, TokenContract, UInt64 } from 'o1js';

import { Pool, minimunLiquidity } from '../Pool';
import { TokenA } from '../TokenA';
import { TokenHolder } from '../TokenHolder';
import { PoolMina } from '../PoolMina';
import { MinaTokenHolder } from '../MinaTokenHolder';
import { TokenStandard } from '../TokenStandard';

let proofsEnabled = true;

describe('Pool Mina', () => {
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

  beforeAll(async () => {
    if (proofsEnabled) {
      console.time('compile pool');
      await TokenStandard.compile();
      const tokenKey = await TokenA.compile();
      const key = await PoolMina.compile();
      await MinaTokenHolder.compile();
      console.timeEnd('compile pool');
    }
  });

  beforeEach(async () => {
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

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2);
      await zkApp.deploy();
      await zkToken0.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey]).send();

    tokenHolder0 = new MinaTokenHolder(zkAppAddress, zkToken0.deriveTokenId());

    const txn2 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await tokenHolder0.deploy();
      await zkToken0.approveAccountUpdate(tokenHolder0.self);
    });
    await txn2.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn2.sign([deployerKey, zkAppPrivateKey]).send();

    // mint token to user
    await mintToken(senderAccount);

  });

  it('create pool', async () => {
    showBalanceToken0();
    showBalanceToken1();

    let amt = UInt64.from(10 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkToken0.transfer(senderAccount, zkApp.self, amt);
      await zkApp.createPool(zkToken0Address, amt, amt);
      await zkToken0.approveAccountUpdate(tokenHolder0.self);
    });
    console.log("createPool", txn.toPretty());
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();

    showBalanceToken0();
    showBalanceToken1();

    const liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    const expected = amt.value.add(amt.value).sub(minimunLiquidity.value);
    console.log("liquidity user", liquidityUser.toString());
    expect(liquidityUser.value).toEqual(expected);
  });

  it('swap tokens', async () => {
    let amt = UInt64.from(10 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.createPool(zkToken0Address, amt, amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    showBalanceToken0();
    showBalanceToken1();
    let amtSwap = UInt64.from(1 * 10 ** 9);
    const txn2 = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.swapFromMina(amtSwap, UInt64.from(1));
    });
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    showBalanceToken0();
    showBalanceToken1();
  });
  /*
    it('supply liquidity', async () => {
  
      await mintToken(bobAccount);
  
      let amt = UInt64.from(10 * 10 ** 9);
      const txn = await Mina.transaction(senderAccount, async () => {
        AccountUpdate.fundNewAccount(senderAccount, 1);
        await zkApp.createPool(zkToken0Address, amt, amt);
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
  
      showBalanceToken0();
      showBalanceToken1();
      let amtLiquidity = UInt64.from(1 * 10 ** 9);
      const txn2 = await Mina.transaction(bobAccount, async () => {
        AccountUpdate.fundNewAccount(bobAccount, 1);
        await zkApp.supplyLiquidity(zkToken0Address, amtLiquidity, amtLiquidity.mul(2));
      });
      await txn2.prove();
      await txn2.sign([bobKey]).send();
  
      showBalanceToken0();
      showBalanceToken1();
  
      const liquidityUser = Mina.getBalance(bobAccount, zkApp.deriveTokenId());
      console.log("liquidity bob", liquidityUser.toString());
    });
  */

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

});