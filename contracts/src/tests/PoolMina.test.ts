import { AccountUpdate, Bool, fetchAccount, Mina, PrivateKey, PublicKey, UInt64, UInt8 } from 'o1js';


import { FungibleTokenAdmin, FungibleToken, MinaTokenHolder, PoolMina, mulDiv, minimunLiquidity } from '../indexmina';

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
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress: PublicKey,
    zkTokenPrivateKey: PrivateKey,
    zkToken: FungibleToken,
    tokenHolder: MinaTokenHolder;

  beforeAll(async () => {
    const analyze = await PoolMina.analyzeMethods();
    getGates(analyze);

    if (proofsEnabled) {
      console.time('compile pool');
      await FungibleTokenAdmin.compile();
      await FungibleToken.compile();
      const key = await PoolMina.compile();
      await MinaTokenHolder.compile();
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

    zkTokenAdminPrivateKey = PrivateKey.random();
    zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey();
    zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress);

    zkTokenPrivateKey = PrivateKey.random();
    zkTokenAddress = zkTokenPrivateKey.toPublicKey();
    zkToken = new FungibleToken(zkTokenAddress);

    const args = { token: zkTokenAddress, symbol: "LDA", src: "https://luminadex.com/" };

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.deploy(args);
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount,
      });
      await zkToken.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
      });
      await zkToken.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false),
      )

      //await zkApp.initialize();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey]).send();

    tokenHolder = new MinaTokenHolder(zkAppAddress, zkToken.deriveTokenId());

    const txn2 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await tokenHolder.deploy();
      await zkToken.approveAccountUpdate(tokenHolder.self);
    });
    await txn2.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn2.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey]).send();


    // mint token to user
    await mintToken(senderAccount);

  });

  it('add first liquidity', async () => {

    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.supplyFirstLiquidities(amt, amtToken);
    });
    console.log("supplyFirstLiquidities", txn.toPretty());
    console.log("supplyFirstLiquidities au", txn.transaction.accountUpdates.length);
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();


    const liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    const expected = amt.value.add(amtToken.value).sub(minimunLiquidity.value);
    console.log("liquidity user", liquidityUser.toString());
    expect(liquidityUser.value).toEqual(expected);

    const balanceToken = Mina.getBalance(zkAppAddress, zkToken.deriveTokenId());
    expect(balanceToken.value).toEqual(amtToken.value);

    const balanceMina = Mina.getBalance(zkAppAddress);
    expect(balanceMina.value).toEqual(amt.value);

  });

  it('withdraw liquidity', async () => {

    const minaUser = Mina.getBalance(senderAccount);
    console.log("mina before", minaUser.toBigInt());
    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.supplyFirstLiquidities(amt, amtToken);
    });
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();

    const minaUserAfterDeposit = Mina.getBalance(senderAccount);
    const expectedMina = minaUser.sub(amt);
    //expect(minaUserAfterDeposit.value).toEqual(expectedMina.value);
    console.log("mina after deposit", minaUserAfterDeposit.toBigInt());

    const liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    const expected = amt.value.add(amtToken.value).sub(minimunLiquidity.value);

    const supply = Mina.getBalance(zkAppAddress, zkApp.deriveTokenId());

    const liquityOut = UInt64.from(1 * 10 ** 9);
    const amountMinaOut = mulDiv(liquityOut, amt, supply);
    const amountTokenOut = mulDiv(liquityOut, amtToken, supply);
    txn = await Mina.transaction(senderAccount, async () => {
      await tokenHolder.withdrawLiquidity(liquityOut, amountMinaOut, amountTokenOut, amt, amtToken, supply);
      await zkToken.approveAccountUpdate(tokenHolder.self);
    });
    console.log("Withdraw liquidity", txn.toPretty());
    console.log("Withdraw liquidity au", txn.transaction.accountUpdates.length);

    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();


    const minaUserAfter = Mina.getBalance(senderAccount);
    console.log("mina after", minaUserAfter.toBigInt());

  });

  it('add second liquidity', async () => {

    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.supplyFirstLiquidities(amt, amtToken);
    });
    console.log("createPool au", txn.transaction.accountUpdates.length);
    await txn.prove();
    await txn.sign([senderKey]).send();

    let liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    const expected = amt.value.add(amtToken.value).sub(minimunLiquidity.value);
    console.log("liquidity user", liquidityUser.toString());
    expect(liquidityUser.value).toEqual(expected);

    let amtMina = UInt64.from(1 * 10 ** 9);
    let amtToken2 = UInt64.from(5 * 10 ** 9);
    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkApp.supplyLiquidity(amtMina, amtToken2, amt, amtToken, liquidityUser);
    });
    console.log("add liquidity from mina", txn.toPretty());
    console.log("add liquidity from mina au", txn.transaction.accountUpdates.length);
    await txn.prove();
    await txn.sign([deployerKey]).send();
    liquidityUser = Mina.getBalance(deployerAccount, zkApp.deriveTokenId());
    console.log("liquidity deployer", liquidityUser.toString());
  });

  it('swap from mina', async () => {
    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.supplyFirstLiquidities(amt, amtToken);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    let amountIn = UInt64.from(1.3 * 10 ** 9);

    const reserveIn = Mina.getBalance(zkAppAddress);
    const reserveOut = Mina.getBalance(zkAppAddress, zkToken.deriveTokenId());

    const balBefore = Mina.getBalance(senderAccount, zkToken.deriveTokenId());

    const balanceMin = reserveOut.sub(reserveOut.div(100));
    const balanceMax = reserveIn.add(reserveIn.div(100));

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));
    const optimalOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn));

    const dif = optimalOut.sub(expectedOut);
    console.log("user lost", dif.toBigInt());

    const txn2 = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 2);
      await tokenHolder.swapFromMina(amountIn, expectedOut, balanceMax, balanceMin);
      await zkToken.approveAccountUpdate(tokenHolder.self);
    });
    console.log("swap from mina", txn2.toPretty());
    console.log("swap from mina au", txn2.transaction.accountUpdates.length);
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const resIN = reserveIn.add(amountIn);
    const resOut = reserveOut.sub(expectedOut);

    const reserveIn2 = Mina.getBalance(zkAppAddress);
    const reserveOut2 = Mina.getBalance(zkAppAddress, zkToken.deriveTokenId());
    expect(reserveIn2.value).toEqual(resIN.value);
    expect(reserveOut2.value).toEqual(resOut.value);

    const balAfter = Mina.getBalance(senderAccount, zkToken.deriveTokenId());
    expect(balAfter.value).toEqual(balBefore.add(expectedOut).value);
  });

  it('swap from token', async () => {
    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.supplyFirstLiquidities(amt, amtToken);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const reserveIn = Mina.getBalance(zkAppAddress, zkToken.deriveTokenId());
    const reserveOut = Mina.getBalance(zkAppAddress);
    let amountIn = UInt64.from(1.3 * 10 ** 9);

    const balanceMin = reserveOut.sub(reserveOut.div(100));
    const balanceMax = reserveIn.add(reserveIn.div(100));

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));
    const optimalOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn));

    const minOut = optimalOut.sub(optimalOut.div(50)); // 2 % dif 

    const balBefore = Mina.getBalance(senderAccount, zkToken.deriveTokenId());

    const userMinaBalBefore = Mina.getBalance(senderAccount);

    const txn2 = await Mina.transaction(senderAccount, async () => {
      //AccountUpdate.fundNewAccount(senderAccount, 2);
      await zkApp.swapFromToken(amountIn, expectedOut, balanceMax, balanceMin);
    });
    console.log("swap from token", txn2.toPretty());
    console.log("swap from token au", txn2.transaction.accountUpdates.length);
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const userMinaBalAfter = Mina.getBalance(senderAccount);

    console.log('optimal out', optimalOut.toBigInt());
    console.log('minimal out', minOut.toBigInt());
    console.log('expected out', expectedOut.toBigInt());
    console.log('received', userMinaBalAfter.sub(userMinaBalBefore).toBigInt());

    // const resIN = reserveIn.add(amountIn);
    // const resOut = reserveOut.sub(expectedOut);

    // const reserveIn2 = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    // const reserveOut2 = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    // expect(reserveIn2.value).toEqual(resIN.value);
    // expect(reserveOut2.value).toEqual(resOut.value);

    const balAfter = Mina.getBalance(senderAccount, zkToken.deriveTokenId());
    expect(balAfter.value).toEqual(balBefore.sub(amountIn).value);
  });

  function showBalanceToken0() {
    let bal = Mina.getBalance(senderAccount, zkToken.deriveTokenId());
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
    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken.mint(user, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkTokenPrivateKey]).send();

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken.mint(deployerAccount, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkTokenPrivateKey]).send();

  }

});