import { FungibleToken, FungibleTokenAdmin } from 'mina-fungible-token';
import { AccountUpdate, Bool, Cache, CircuitString, fetchAccount, Field, Mina, Poseidon, PrivateKey, PublicKey, UInt64, UInt8, VerificationKey } from 'o1js';
import { contractHash, contractHolderHash, Faucet, PoolData, PoolFactory, PoolTokenHolder, Pool } from '../indexmina';
import { PoolSampleTest } from './PoolSampleTest';
import { PoolUpgradeTest } from './PoolUpgradeTest';
import { PoolHolderUpgradeTest } from './PoolHolderUpgradeTest';

let proofsEnabled = false;


describe('Pool data', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    compileKey: VerificationKey,
    vk: any,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolFactory,
    zkPoolAddress: PublicKey,
    zkPoolPrivateKey: PrivateKey,
    zkPool: Pool,
    zkPoolDataAddress: PublicKey,
    zkPoolDataPrivateKey: PrivateKey,
    zkPoolData: PoolData,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress: PublicKey,
    zkTokenPrivateKey: PrivateKey,
    zkToken: FungibleToken,
    tokenHolder: PoolTokenHolder;

  beforeAll(async () => {
    //const analyze = await Faucet.analyzeMethods();
    //getGates(analyze);

    const cache = Cache.FileSystem('./cache');
    vk = await PoolSampleTest.compile({ cache });
    const compileResult = await PoolUpgradeTest.compile({ cache });
    compileKey = compileResult.verificationKey;


    if (proofsEnabled) {
      console.time('compile PoolData');
      await PoolData.compile({ cache });
      await FungibleTokenAdmin.compile({ cache });
      await FungibleToken.compile({ cache });
      await PoolFactory.compile({ cache });
      await Pool.compile({ cache });
      await PoolTokenHolder.compile({ cache });
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

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new PoolFactory(zkAppAddress);

    zkPoolPrivateKey = PrivateKey.random();
    zkPoolAddress = zkPoolPrivateKey.toPublicKey();
    zkPool = new Pool(zkPoolAddress);

    zkTokenAdminPrivateKey = PrivateKey.random();
    zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey();
    zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress);

    zkPoolDataPrivateKey = PrivateKey.random();
    zkPoolDataAddress = zkPoolDataPrivateKey.toPublicKey();
    zkPoolData = new PoolData(zkPoolDataAddress);

    zkTokenPrivateKey = PrivateKey.random();
    zkTokenAddress = zkTokenPrivateKey.toPublicKey();
    zkToken = new FungibleToken(zkTokenAddress);

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken.deriveTokenId());

    const txn0 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkPoolData.deploy({
        owner: bobAccount,
        protocol: aliceAccount
      });

    });
    await txn0.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn0.sign([deployerKey, zkPoolDataPrivateKey]).send();

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.deploy({ symbol: "FAC", src: "https://luminadex.com/", poolData: zkPoolDataAddress });
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
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey]).send();

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(zkPoolAddress, zkTokenAddress);
    });

    //console.log("Pool creation au", txn3.transaction.accountUpdates.length);
    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send();

  });


  it('update owner', async () => {
    let owner = await zkPoolData.owner.fetch();
    expect(owner?.toBase58()).toEqual(bobAccount.toBase58());
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewOwner(senderAccount);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let newowner = await zkPoolData.newOwner.fetch();
    expect(newowner?.toBase58()).toEqual(senderAccount.toBase58());

    let oldowner = await zkPoolData.owner.fetch();
    expect(oldowner?.toBase58()).toEqual(bobAccount.toBase58());

    // aceept ownership
    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.acceptOwnership();
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    let ownership = await zkPoolData.owner.fetch();
    expect(ownership?.toBase58()).toEqual(senderAccount.toBase58());

  });

  it('update protocol', async () => {

    let protocol = await zkPoolData.protocol.fetch();
    expect(protocol?.toBase58()).toEqual(aliceAccount.toBase58());
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewProtocol(deployerAccount);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let protocolNew = await zkPoolData.protocol.fetch();
    expect(protocolNew?.toBase58()).toEqual(deployerAccount.toBase58());

  });


  it('update verification key', async () => {
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.updateVerificationKey(vk.verificationKey);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let poolDatav2 = new PoolSampleTest(zkPoolDataAddress);
    let version = await poolDatav2.version();
    expect(version?.toBigInt()).toEqual(2n);

  });

  it('update pool', async () => {
    const newVK = await PoolUpgradeTest.compile();
    const key = newVK.verificationKey;

    console.log("Pool data", zkPoolDataAddress.toBase58());
    const txn1 = await Mina.transaction(deployerAccount, async () => {
      await zkPool.updateVerificationKey(key);
    });
    console.log("update pool", txn1.toPretty());
    await txn1.prove();
    await txn1.sign([deployerKey, bobKey]).send();

    let poolDatav2 = new PoolUpgradeTest(zkPoolAddress);
    let version = await poolDatav2.version();
    expect(version?.toBigInt()).toEqual(33n);

  });


  it('update pool holder', async () => {
    const newVK = await PoolHolderUpgradeTest.compile();
    const key = newVK.verificationKey;

    const txn1 = await Mina.transaction(deployerAccount, async () => {
      await tokenHolder.updateVerificationKey(key);
      await zkToken.approveAccountUpdate(tokenHolder.self);
    });
    console.log("update pool holder", txn1.toPretty());
    await txn1.prove();
    await txn1.sign([deployerKey, bobKey]).send();

    let poolDatav2 = new PoolHolderUpgradeTest(zkPoolAddress, zkToken.deriveTokenId());
    let version = await poolDatav2.version();
    expect(version?.toBigInt()).toEqual(55n);

  });

  it('failed without owner key', async () => {
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.updateVerificationKey(vk.verificationKey);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewOwner(senderAccount);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPool.updateVerificationKey(compileKey);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await tokenHolder.updateVerificationKey(compileKey);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewProtocol(senderAccount);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();
  });

  it('failed change owner', async () => {
    let owner = await zkPoolData.owner.fetch();
    expect(owner?.toBase58()).toEqual(bobAccount.toBase58());
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewOwner(aliceAccount);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let newowner = await zkPoolData.newOwner.fetch();
    expect(newowner?.toBase58()).toEqual(aliceAccount.toBase58());

    let oldowner = await zkPoolData.owner.fetch();
    expect(oldowner?.toBase58()).toEqual(bobAccount.toBase58());

    // aceept ownership
    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.acceptOwnership();
    });
    await txn.prove();
    // you need to sign with the new owner key to get the ownership
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    let ownership = await zkPoolData.owner.fetch();
    expect(ownership?.toBase58()).toEqual(bobAccount.toBase58());
  });
});