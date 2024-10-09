import { FungibleToken, FungibleTokenAdmin } from 'mina-fungible-token';
import { AccountUpdate, Bool, fetchAccount, Mina, PrivateKey, PublicKey, UInt64, UInt8 } from 'o1js';
import { contractHash, contractHolderHash, Faucet, PoolData } from '../indexmina';

let proofsEnabled = false;

describe('Pool data', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    zkPoolDataAddress: PublicKey,
    zkPoolDataPrivateKey: PrivateKey,
    zkPoolData: PoolData;

  beforeAll(async () => {
    //const analyze = await Faucet.analyzeMethods();
    //getGates(analyze);

    if (proofsEnabled) {
      console.time('compile PoolData');
      await PoolData.compile();
      console.timeEnd('compile PoolData');
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

    zkPoolDataPrivateKey = PrivateKey.random();
    zkPoolDataAddress = zkPoolDataPrivateKey.toPublicKey();
    zkPoolData = new PoolData(zkPoolDataAddress);

    const txn0 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkPoolData.deploy({
        poolHash: contractHash,
        poolHolderHash: contractHolderHash,
        owner: bobAccount,
        protocol: aliceAccount
      });

    });
    await txn0.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn0.sign([deployerKey, zkPoolDataPrivateKey]).send();
  });

  it('claim faucet', async () => {

    let amt = UInt64.from(1000 * 10 ** 9);
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkToken.mint(zkFaucetAddress, amt);
    });
    await txn.prove();
    await txn.sign([senderKey, deployerKey]).send();


    txn = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 2);
      await zkFaucet.claim();
      await zkToken.approveAccountUpdate(zkFaucet.self);
    });
    console.log("claim faucet", txn.toPretty());
    await txn.prove();
    await txn.sign([bobKey]).send();

    const faucetAmount = UInt64.from(100 * 10 ** 9);
    let balanceBob = Mina.getBalance(bobAccount, zkToken.deriveTokenId());
    expect(balanceBob.value).toEqual(faucetAmount.value);

    txn = await Mina.transaction(bobAccount, async () => {
      await zkFaucet.claim();
      await zkToken.approveAccountUpdate(zkFaucet.self);
    });
    console.log("claim faucet 2", txn.toPretty());
    await txn.prove();
    await expect(txn.sign([bobKey]).send()).rejects.toThrow();
  });


});