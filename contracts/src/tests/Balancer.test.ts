import { Account, AccountUpdate, Bool, Field, Mina, PrivateKey, PublicKey, TokenContract, UInt64 } from 'o1js';

import { Pool, minimunLiquidity } from '../Pool';
import { TokenHolder } from '../TokenHolder';
import { TokenA } from '../TokenA';
import { TokenB } from '../TokenB';
import { BalancerHolder } from '../BalancerHolder';
import { Balancer } from '../Balancer';
import { ShowBalance } from '../ShowBalance';

let proofsEnabled = true;

describe('Balancer', () => {
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
    zkApp: Balancer,
    zkAppAddress2: PublicKey,
    zkAppPrivateKey2: PrivateKey,
    zkApp2: ShowBalance,
    zkToken0Address: PublicKey,
    zkToken0PrivateKey: PrivateKey,
    zkToken0: TokenA,
    tokenHolder0: BalancerHolder;

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
    zkApp = new Balancer(zkAppAddress);

    zkAppPrivateKey2 = PrivateKey.random();
    zkAppAddress2 = zkAppPrivateKey2.toPublicKey();
    zkApp2 = new ShowBalance(zkAppAddress2);

    zkToken0PrivateKey = PrivateKey.random();
    zkToken0Address = zkToken0PrivateKey.toPublicKey();
    zkToken0 = new TokenA(zkToken0Address);

    // defined balance A address
    Balancer.tokenA = zkToken0Address;

    if (proofsEnabled) {
      console.time('compile token');
      const tokenKey = await TokenA.compile();
      console.timeEnd('compile token');
      console.time('compile balancer');
      const key = await Pool.compile();
      console.timeEnd('compile balancer');
      console.log("key pool", key.verificationKey.data);
      console.log("key pool hash", key.verificationKey.hash.toBigInt());
      await ShowBalance.compile();
    }


    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 3);
      await zkApp.deploy();
      await zkToken0.deploy();
      await zkApp2.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey, zkAppPrivateKey2]).send();

    tokenHolder0 = new BalancerHolder(zkAppAddress, zkToken0.deriveTokenId());

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

  it('create balancer', async () => {

    let amt = UInt64.from(10 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.create(amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();


    const amountBalance = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    console.log("amountBalance user", amountBalance.toBigInt());
    expect(amountBalance.value).toEqual(amt.value);

    const reserveToken = await zkApp.reserveA.fetch();
    expect(reserveToken?.value).toEqual(amt.value);

    const balanceToken = await zkApp.getBalance();
    expect(balanceToken.value).toEqual(amt.value);

    const balanceToken2 = await zkApp2.getBalance(zkAppAddress, zkToken0Address);
    expect(balanceToken2.value).toEqual(amt.value);
  });

  it('widraw from balance', async () => {

    let amt = UInt64.from(10 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.create(amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    let amtWithdraw = UInt64.from(1 * 10 ** 9);
    const txn2 = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.withdrawFromBalance(amtWithdraw);
    });
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const expected = amt.sub(amtWithdraw);
    const amountBalance = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    console.log("amountBalance user", amountBalance.toBigInt());
    expect(amountBalance.value).toEqual(expected.value);

    const reserveToken = await zkApp.reserveA.fetch();
    expect(reserveToken?.value).toEqual(expected.value);

    const balanceToken = await zkApp.getBalance();
    expect(balanceToken.value).toEqual(expected.value);

    const balanceToken2 = await zkApp2.getBalance(zkAppAddress, zkToken0Address);
    expect(balanceToken2.value).toEqual(expected.value);
  });

  it('widraw from reserve', async () => {

    let amt = UInt64.from(10 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.create(amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    let amtWithdraw = UInt64.from(1 * 10 ** 9);
    const txn2 = await Mina.transaction(senderAccount, async () => {
      await zkApp.withdrawFromReserve(amtWithdraw);
    });
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const expected = amt.sub(amtWithdraw);
    const amountBalance = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    console.log("amountBalance user", amountBalance.toBigInt());
    expect(amountBalance.value).toEqual(expected.value);

    const reserveToken = await zkApp.reserveA.fetch();
    expect(reserveToken?.value).toEqual(expected.value);

    const balanceToken = await zkApp.getBalance();
    expect(balanceToken.value).toEqual(expected.value);

    const balanceToken2 = await zkApp2.getBalance(zkAppAddress, zkToken0Address);
    expect(balanceToken2.value).toEqual(expected.value);
  });

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