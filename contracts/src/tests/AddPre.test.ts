import { AccountUpdate, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';


import { AddPre } from '../AddPre';

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
    zkApp: AddPre;

  beforeAll(async () => {
    if (proofsEnabled) {
      console.time('compile pool');
      const key = await AddPre.compile();
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
    zkApp = new AddPre(zkAppAddress);


    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();



  });


  it('add mina ', async () => {

    let amt = UInt64.from(10 * 10 ** 9);

    let txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.firstAddMina(amt);
    });
    console.log("firstAddMina", txn.toPretty());
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();

    // let liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    // const expected = amt.value.add(amtToken.value).sub(minimunLiquidity.value);
    // console.log("liquidity user", liquidityUser.toString());
    // expect(liquidityUser.value).toEqual(expected);

    let amtMina = UInt64.from(11 * 10 ** 9);
    txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.addMina(amtMina);
    });
    console.log("addMina", txn.toPretty());
    await txn.prove();
    await txn.sign([senderKey, zkAppPrivateKey]).send();
    // liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
    // console.log("liquidity user", liquidityUser.toString());
  });


});