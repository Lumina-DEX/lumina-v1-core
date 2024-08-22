import { AccountUpdate, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';

import { PoolMina, PoolMinaDeployProps, minimunLiquidity } from '../PoolMina';
import { MinaTokenHolder } from '../MinaTokenHolder';
import { FungibleToken } from '../FungibleToken';
import { mulDiv } from '../MathLibrary';

let proofsEnabled = false;

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
    zkAppAddress2: PublicKey,
    zkAppPrivateKey2: PrivateKey,
    zkApp2: PoolMina,
    zkToken0Address: PublicKey,
    zkToken0PrivateKey: PrivateKey,
    zkToken0: FungibleToken,
    tokenHolder0: MinaTokenHolder,
    tokenHolder1: MinaTokenHolder;

  beforeAll(async () => {
    if (proofsEnabled) {
      console.time('compile pool');
      await FungibleToken.compile();
      const key = await PoolMina.compile();
      await MinaTokenHolder.compile();

      console.log("provers", key.provers.length);

      const analyze = await PoolMina.analyzeMethods();
      getGates(analyze);

      console.timeEnd('compile pool');
    }

    function getGates(analyze: any) {
      for (const key in analyze) {
        if (Object.prototype.hasOwnProperty.call(analyze, key)) {
          const element = analyze[key];
          console.log(key, element?.gates.length)
        }
      }
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

    zkAppPrivateKey2 = PrivateKey.random();
    zkAppAddress2 = zkAppPrivateKey2.toPublicKey();
    zkApp2 = new PoolMina(zkAppAddress2);

    zkToken0PrivateKey = PrivateKey.random();
    zkToken0Address = zkToken0PrivateKey.toPublicKey();
    zkToken0 = new FungibleToken(zkToken0Address);

    const args: PoolMinaDeployProps = { token: zkToken0Address };
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.deploy(args);
      await zkApp2.deploy(args);
      await zkToken0.deploy({
        symbol: "tokA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
      });
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkAppPrivateKey2, zkToken0PrivateKey]).send();

    tokenHolder0 = new MinaTokenHolder(zkAppAddress, zkToken0.deriveTokenId());
    tokenHolder1 = new MinaTokenHolder(zkAppAddress2, zkToken0.deriveTokenId());

    const txn2 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2);
      await tokenHolder0.deploy();
      await tokenHolder1.deploy();
      await zkToken0.approveAccountUpdate(tokenHolder0.self);
      await zkToken0.approveAccountUpdate(tokenHolder1.self);
    });
    await txn2.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn2.sign([deployerKey, zkAppPrivateKey, zkAppPrivateKey2]).send();

    // mint token to user
    await mintToken(senderAccount);

  });

  it('add first liquidity', async () => {
    showBalanceToken0();
    showBalanceToken1();

    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.supplyFirstLiquidities(amtToken, amt);
    });
    console.log("supplyFirstLiquidities", txn.toPretty());
    console.log("createPool au", txn.transaction.accountUpdates.length);
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();


    // const liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    // const expected = amt.value.add(amtToken.value).sub(minimunLiquidity.value);
    // console.log("liquidity user", liquidityUser.toString());
    // expect(liquidityUser.value).toEqual(expected);

    const balanceToken = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    expect(balanceToken.value).toEqual(amtToken.value);

    const balanceMina = Mina.getBalance(zkAppAddress);
    expect(balanceMina.value).toEqual(amt.value);

    txn = await Mina.transaction(senderAccount, async () => {
      await zkApp2.supplyFirstLiquidities(amtToken, amt);
    });
    console.log("createPool au", txn.transaction.accountUpdates.length);
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey2]).send();

  });


  it('add mina ', async () => {

    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.supplyFirstLiquidities(amtToken, amt);
    });
    console.log("createPool au", txn.transaction.accountUpdates.length);
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();

    // let liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    // const expected = amt.value.add(amtToken.value).sub(minimunLiquidity.value);
    // console.log("liquidity user", liquidityUser.toString());
    // expect(liquidityUser.value).toEqual(expected);

    let amtMina = UInt64.from(1 * 10 ** 9);
    txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.supplyLiquidityFromMina(amtMina, amtToken);
    });
    console.log("add liquidity from mina", txn.transaction.accountUpdates.length);
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();
    // liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    // console.log("liquidity user", liquidityUser.toString());
  });


  it('swap from mina', async () => {
    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.supplyFirstLiquidities(amtToken, amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    let amountIn = UInt64.from(1.3 * 10 ** 9);

    const reserveIn = Mina.getBalance(zkAppAddress);
    const reserveOut = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());

    const balBefore = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());

    const expectedOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn))
    const txn2 = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.swapFromMina(amountIn, UInt64.from(1));
    });
    console.log("swap from mina", txn2.toPretty());
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const resIN = reserveIn.add(amountIn);
    const resOut = reserveOut.sub(expectedOut);

    const reserveIn2 = Mina.getBalance(zkAppAddress);
    const reserveOut2 = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    expect(reserveIn2.value).toEqual(resIN.value);
    expect(reserveOut2.value).toEqual(resOut.value);

    const balAfter = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
    expect(balAfter.value).toEqual(balBefore.add(expectedOut).value);
  });

  it('swap from token', async () => {
    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.supplyFirstLiquidities(amtToken, amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const reserveIn = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    const reserveOut = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    let amountIn = UInt64.from(1.3 * 10 ** 9);

    const expectedOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn))
    const balBefore = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());

    const txn2 = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.swapFromToken(amountIn, UInt64.from(1));
    });
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const resIN = reserveIn.add(amountIn);
    const resOut = reserveOut.sub(expectedOut);

    const reserveIn2 = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    const reserveOut2 = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    expect(reserveIn2.value).toEqual(resIN.value);
    expect(reserveOut2.value).toEqual(resOut.value);

    const balAfter = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
    expect(balAfter.value).toEqual(balBefore.sub(amountIn).value);
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
    // token are minted to original deployer, so just transfer it for test
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken0.transfer(deployerAccount, user, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkToken0PrivateKey]).send();

  }

});