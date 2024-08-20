import { AccountUpdate, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';

import { PoolAccount, PoolMinaDeployProps, minimunLiquidity } from '../PoolAccount';
import { MinaTokenHolder } from '../MinaTokenHolder';
import { TokenStandard } from '../TokenStandard';
import { mulDiv } from '../MathLibrary';

let proofsEnabled = true;

describe('Pool Account', () => {
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
    zkApp: PoolAccount,
    zkToken0Address: PublicKey,
    zkToken0PrivateKey: PrivateKey,
    zkToken0: TokenStandard,
    tokenHolder0: MinaTokenHolder;

  beforeAll(async () => {
    if (proofsEnabled) {
      console.time('compile pool');
      await TokenStandard.compile();
      const key = await PoolAccount.compile();
      await MinaTokenHolder.compile();

      console.log("provers", key.provers.length);

      const analyze = await PoolAccount.analyzeMethods();
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
    zkApp = new PoolAccount(zkAppAddress);


    zkToken0PrivateKey = PrivateKey.random();
    zkToken0Address = zkToken0PrivateKey.toPublicKey();
    zkToken0 = new TokenStandard(zkToken0Address);

    const args: PoolMinaDeployProps = { token: zkToken0Address };
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 3);
      await zkApp.deploy(args);
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

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkApp.deployAccount();
      //await zkApp.approve(zkApp.self);
    });
    console.log("txn3", txn3.toPretty());
    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkAppPrivateKey]).send();

    // mint token to user
    await mintToken(senderAccount);

  });


  it('swap from mina', async () => {
    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.supplyFirstLiquidities(amtToken, amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    let amountIn = UInt64.from(1.3 * 10 ** 9);

    const reserveIn = zkApp.reserveMina.getAndRequireEquals();
    const reserveOut = zkApp.reserveToken.getAndRequireEquals();

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

    const reserveIn2 = zkApp.reserveMina.getAndRequireEquals();
    const reserveOut2 = zkApp.reserveToken.getAndRequireEquals();
    expect(reserveIn2.value).toEqual(resIN.value);
    expect(reserveOut2.value).toEqual(resOut.value);

    const balAfter = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
    expect(balAfter.value).toEqual(balBefore.add(expectedOut).value);
  });

  it('swap from token', async () => {
    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkApp.supplyFirstLiquidities(amtToken, amt);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const reserveIn = zkApp.reserveToken.getAndRequireEquals();
    const reserveOut = zkApp.reserveMina.getAndRequireEquals();
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

    const reserveIn2 = zkApp.reserveToken.getAndRequireEquals();
    const reserveOut2 = zkApp.reserveMina.getAndRequireEquals();
    expect(reserveIn2.value).toEqual(resIN.value);
    expect(reserveOut2.value).toEqual(resOut.value);

    const balAfter = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
    expect(balAfter.value).toEqual(balBefore.sub(amountIn).value);
  });


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