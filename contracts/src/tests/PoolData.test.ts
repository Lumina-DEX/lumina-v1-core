import { FungibleToken, FungibleTokenAdmin } from 'mina-fungible-token';
import { AccountUpdate, Bool, Cache, MerkleMap, Mina, Poseidon, PrivateKey, PublicKey, Signature, UInt64, UInt8, VerificationKey } from 'o1js';
import { PoolFactory, PoolTokenHolder, Pool, SignerMerkleWitness, mulDiv } from '../index';
import { PoolUpgradeTest } from './PoolUpgradeTest';
import { MultisigInfo, MultisigProgram, MultisigProof, SignatureInfo, SignatureRight, UpdateAccountInfo } from '../pool/MultisigProof';

let proofsEnabled = false;


describe('Pool data', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    compileKey: VerificationKey,
    merkle: MerkleMap,
    vk: any,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    dylanAccount: Mina.TestPublicKey,
    senderPublic: PublicKey,
    deployerPublic: PublicKey,
    bobPublic: PublicKey,
    alicePublic: PublicKey,
    allRight: SignatureRight,
    deployRight: SignatureRight,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolFactory,
    zkPoolAddress: PublicKey,
    zkPoolPrivateKey: PrivateKey,
    zkPool: Pool,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress: PublicKey,
    zkTokenPrivateKey: PrivateKey,
    zkToken: FungibleToken,
    zkToken2PrivateKey: PrivateKey,
    zkToken2Address: PublicKey,
    zkToken2: FungibleToken,
    tokenHolder: PoolTokenHolder;

  beforeAll(async () => {
    //const analyze = await Faucet.analyzeMethods();
    //getGates(analyze);

    const cache = Cache.FileSystem('./cache');
    await MultisigProgram.compile({ proofsEnabled });
    const compileResult = await PoolUpgradeTest.compile({ cache });
    compileKey = compileResult.verificationKey;

    if (proofsEnabled) {
      console.time('compile PoolData');
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
    [deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;
    bobKey = bobAccount.key;
    aliceKey = aliceAccount.key;

    senderPublic = senderKey.toPublicKey();
    bobPublic = bobKey.toPublicKey();
    alicePublic = aliceKey.toPublicKey();
    deployerPublic = deployerKey.toPublicKey();

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new PoolFactory(zkAppAddress);

    zkPoolPrivateKey = PrivateKey.random();
    zkPoolAddress = zkPoolPrivateKey.toPublicKey();
    zkPool = new Pool(zkPoolAddress);

    zkTokenAdminPrivateKey = PrivateKey.random();
    zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey();
    zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress);

    zkTokenPrivateKey = PrivateKey.random();
    zkTokenAddress = zkTokenPrivateKey.toPublicKey();
    zkToken = new FungibleToken(zkTokenAddress);

    zkToken2PrivateKey = PrivateKey.random();
    zkToken2Address = zkToken2PrivateKey.toPublicKey();
    zkToken2 = new FungibleToken(zkToken2Address);

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken.deriveTokenId());

    merkle = new MerkleMap();
    allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true));
    deployRight = SignatureRight.canDeployPool();
    merkle.set(Poseidon.hash(bobPublic.toFields()), allRight.hash());
    merkle.set(Poseidon.hash(alicePublic.toFields()), allRight.hash());
    merkle.set(Poseidon.hash(senderPublic.toFields()), allRight.hash());
    merkle.set(Poseidon.hash(deployerPublic.toFields()), deployRight.hash());
    const root = merkle.getRoot();

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.deploy({
        symbol: "FAC", src: "https://luminadex.com/",
        protocol: aliceAccount,
        delegator: dylanAccount,
        approvedSigner: root
      });
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount,
      });
      await zkToken.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
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

    const txn5 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2);
      await zkToken2.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
      });
      await zkToken2.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false),
      )
    });
    await txn5.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn5.sign([deployerKey, zkToken2PrivateKey]).send();

    const signature = Signature.create(deployerKey, zkPoolAddress.toFields());
    const witness = merkle.getWitness(Poseidon.hash(deployerPublic.toFields()));
    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(zkPoolAddress, zkTokenAddress, bobAccount, signature, witness, deployRight);
    });

    //console.log("Pool creation au", txn3.transaction.accountUpdates.length);
    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send();

  });

  it('update pool', async () => {
    const txn1 = await Mina.transaction(deployerAccount, async () => {
      // todo proof
      // await zkPool.updateVerificationKey(compileKey);
    });
    await txn1.prove();
    await txn1.sign([deployerKey, bobKey]).send();

    let poolDatav2 = new PoolUpgradeTest(zkPoolAddress);
    let version = await poolDatav2.version();
    expect(version?.toBigInt()).toEqual(33n);

  });

  it('update pool holder', async () => {
    const txn1 = await Mina.transaction(deployerAccount, async () => {
      await tokenHolder.updateVerificationKey(compileKey);
      await zkPool.approve(tokenHolder.self);
    });
    await txn1.prove();
    await txn1.sign([deployerKey, bobKey]).send();

    let poolDatav2 = new PoolUpgradeTest(zkPoolAddress, zkToken.deriveTokenId());
    let version = await poolDatav2.version();
    expect(version?.toBigInt()).toEqual(33n);

  });

  it('update pool factory', async () => {
    const txn1 = await Mina.transaction(deployerAccount, async () => {
      //await zkApp.updateVerificationKey(compileKey);
    });
    await txn1.prove();
    await txn1.sign([deployerKey, bobKey]).send();

    let poolDatav2 = new PoolUpgradeTest(zkAppAddress);
    let version = await poolDatav2.version();
    expect(version?.toBigInt()).toEqual(33n);

  });

  it('math test', async () => {
    const result = 150n * 12000n / 300n;
    const resultMul = mulDiv(UInt64.from(150n), UInt64.from(12000n), UInt64.from(300n));
    expect(result).toEqual(resultMul.toBigInt());

    const resultFix = 10000n * 1200000000n / 300n;
    const resultMulFix = mulDiv(UInt64.from(10000n), UInt64.from(1200000000n), UInt64.from(300n));
    expect(resultFix).toEqual(resultMulFix.toBigInt());

    const resultBigMul = 300_000_000_000_000n * 12_000_000_000_000n / 300_000_000n;
    const resultMulBigMul = mulDiv(UInt64.from(300_000_000_000_000n), UInt64.from(12_000_000_000_000n), UInt64.from(300_000_000n));
    expect(resultBigMul).toEqual(resultMulBigMul.toBigInt());

    const resultFloat = 300n * 12000n / 17n;
    const resultMulFloat = mulDiv(UInt64.from(300n), UInt64.from(12000n), UInt64.from(17n));
    expect(resultFloat).toEqual(resultMulFloat.toBigInt());

  });



  it('update protocol', async () => {

    let protocol = await zkApp.protocol.fetch();
    expect(protocol?.toBase58()).toEqual(aliceAccount.toBase58());
    let txn = await Mina.transaction(senderAccount, async () => {
      // await zkApp.setNewProtocol(deployerAccount);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let protocolNew = await zkApp.protocol.fetch();
    expect(protocolNew?.toBase58()).toEqual(deployerAccount.toBase58());

  });

  it('set delegator', async () => {

    let delegator = await zkApp.delegator.fetch();
    let poolAccount = zkPool.account?.delegate?.get();
    expect(delegator?.toBase58()).toEqual(dylanAccount.toBase58());
    expect(poolAccount?.toBase58()).toEqual(zkPoolAddress.toBase58());

    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPool.setDelegator();
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    poolAccount = zkPool.account?.delegate?.get();
    expect(poolAccount?.toBase58()).toEqual(dylanAccount.toBase58());

    // already set
    await expect(Mina.transaction(senderAccount, async () => {
      await zkPool.setDelegator();
    })).rejects.toThrow();
    poolAccount = zkPool.account?.delegate?.get();
    expect(poolAccount?.toBase58()).toEqual(dylanAccount.toBase58());

    const info = new UpdateAccountInfo({ oldUser: aliceAccount, newUser: bobAccount, deadline: UInt64.from(time) });

    const signBob = Signature.create(bobKey, info.toFields());
    const signAlice = Signature.create(aliceKey, info.toFields());
    const signDylan = Signature.create(dylanAccount.key, info.toFields());

    const time = Date.now();
    const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadline: UInt64.from(time) })
    const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right: allRight })
    const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right: allRight })
    const infoDylan = new SignatureInfo({ user: senderPublic, witness: merkle.getWitness(Poseidon.hash(senderPublic.toFields())), signature: signDylan, right: allRight })
    const array = [infoBob, infoAlice, infoDylan];
    const multisig = await MultisigProgram.verifyUpdateDelegator(multi, info, array);
    const proof = new MultisigProof(multisig.proof);


    // define a new delegator
    txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.setNewDelegator(proof, aliceAccount);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPool.setDelegator();
    });
    await txn.prove();
    console.log("set delegator", txn.toPretty());
    await txn.sign([senderKey]).send();

    poolAccount = zkPool.account?.delegate?.get();
    console.log("pool account", poolAccount.toBase58());
    expect(poolAccount?.toBase58()).toEqual(aliceAccount.toBase58());
  });


  it('failed change delegator', async () => {

    // only owner can change it
    let txn = await Mina.transaction(senderAccount, async () => {
      //await zkApp.setNewDelegator(aliceAccount);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

  });



  it('failed without owner key', async () => {
    let txn = await Mina.transaction(senderAccount, async () => {
      // await zkApp.updateVerificationKey(compileKey);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      // await zkApp.setNewOwner(senderAccount);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();


    txn = await Mina.transaction(senderAccount, async () => {
      // await zkApp.setNewProtocol(senderAccount);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    const root = merkle.getRoot();

    txn = await Mina.transaction(senderAccount, async () => {
      // await zkApp.updateApprovedSigner(root);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      // todo proof
      //await zkPool.updateVerificationKey(compileKey);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await tokenHolder.updateVerificationKey(compileKey);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();
  });


  it('deploy pool with first authorized account', async () => {
    const newPool = PrivateKey.random();
    const newPoolAddress = newPool.toPublicKey();
    const signature = Signature.create(bobKey, newPoolAddress.toFields());

    const witness = merkle.getWitness(0n);
    const circuitWitness = new SignerMerkleWitness(witness);

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, bobAccount, signature, circuitWitness);
    });

    //console.log("Pool creation au", txn3.transaction.accountUpdates.length);
    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, newPool]).send();
  });

  it('deploy pool with second authorized account', async () => {
    const newPool = PrivateKey.random();
    const newPoolAddress = newPool.toPublicKey();
    const signature = Signature.create(aliceKey, newPoolAddress.toFields());
    const witness = merkle.getWitness(1n);
    const circuitWitness = new SignerMerkleWitness(witness);

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, aliceAccount, signature, circuitWitness);
    });

    //console.log("Pool creation au", txn3.transaction.accountUpdates.length);
    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, newPool]).send();
  });

  it('deploy pool failed with unauthorized account', async () => {
    const newPool = PrivateKey.random();
    const newPoolAddress = newPool.toPublicKey();
    const signature = Signature.create(senderKey, newPoolAddress.toFields());

    const witness = merkle.getWitness(0n);
    const circuitWitness = new SignerMerkleWitness(witness);

    await expect(Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, senderAccount, signature, circuitWitness);
    })).rejects.toThrow();

    // empty account failed too
    await expect(Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, PublicKey.empty(), signature, circuitWitness);
    })).rejects.toThrow();

    merkle.setLeaf(2n, Poseidon.hash(senderAccount.toFields()));
    const newRoot = merkle.getRoot();
    // works after authorized this account
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.updateApprovedSigner(newRoot);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    const newWitness = merkle.getWitness(2n);
    const newCircuitWitness = new SignerMerkleWitness(newWitness);
    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, senderAccount, signature, newCircuitWitness);
    });

    await txn3.prove();
    await txn3.sign([deployerKey, newPool]).send();
  });
});