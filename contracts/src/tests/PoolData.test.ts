import { FungibleToken, FungibleTokenAdmin } from 'mina-fungible-token';
import { AccountUpdate, Bool, Cache, Field, MerkleMap, Mina, Poseidon, PrivateKey, Provable, PublicKey, Signature, TokenId, UInt64, UInt8, VerificationKey } from 'o1js';
import { PoolFactory, PoolTokenHolder, Pool, mulDiv } from '../index';
import { PoolUpgradeTest } from './PoolUpgradeTest';
import { MultisigInfo, MultisigProgram, MultisigProof, SignatureInfo, SignatureRight, UpdateAccountInfo, UpgradeInfo } from '../pool/MultisigProof';


let proofsEnabled = false;

const vkUpgradeTest = new VerificationKey({
  data: "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",
  hash: Field.from(1094855669395027188090902596744887124365128625005606285591537108109825582697n)
});


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
    dylanPublic: PublicKey,
    deployerPublic: PublicKey,
    bobPublic: PublicKey,
    alicePublic: PublicKey,
    allRight: SignatureRight,
    signerRight: SignatureRight,
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

    compileKey = vkUpgradeTest;

    const cache = Cache.FileSystem('./cache');
    const multisigProgram = await MultisigProgram.compile({ proofsEnabled });
    // const compileResult = await PoolUpgradeTest.compile({ cache, });

    // console.log("poolUpgradeTest", compileResult.verificationKey.data);
    // console.log("poolUpgradeTest hash", compileResult.verificationKey.hash.toBigInt());

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
    dylanPublic = dylanAccount.key.toPublicKey();

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
    signerRight = SignatureRight.canUpdateSigner();
    merkle.set(Poseidon.hash(bobPublic.toFields()), allRight.hash());
    merkle.set(Poseidon.hash(alicePublic.toFields()), allRight.hash());
    merkle.set(Poseidon.hash(senderPublic.toFields()), signerRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), allRight.hash());;
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
      await zkApp.createPool(zkPoolAddress, zkTokenAddress, deployerAccount, signature, witness, deployRight);
    });

    //console.log("Pool creation au", txn3.transaction.accountUpdates.length);
    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send();

  });

  it('update pool', async () => {
    const proof = await getProof(zkPoolAddress, zkPool.tokenId, compileKey);
    Provable.log("Tokenid", zkPool.tokenId);
    const txn1 = await Mina.transaction(deployerAccount, async () => {
      await zkPool.updateVerificationKey(proof, compileKey);
    });
    await txn1.prove();
    await txn1.sign([deployerKey, bobKey]).send();

    let poolDatav2 = new PoolUpgradeTest(zkPoolAddress);
    let version = await poolDatav2.version();
    expect(version?.toBigInt()).toEqual(33n);

  });

  async function getProof(contractAddress: PublicKey, tokenId: Field, key: VerificationKey) {
    const time = Date.now();
    const info = new UpgradeInfo({ contractAddress, tokenId, newVkHash: key.hash, deadline: UInt64.from(time) });


    const signBob = Signature.create(bobKey, info.toFields());
    const signAlice = Signature.create(aliceKey, info.toFields());
    const signDylan = Signature.create(dylanAccount.key, info.toFields());

    const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadline: UInt64.from(time) })
    const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right: allRight })
    const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right: allRight })
    const infoDylan = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan, right: allRight })
    const array = [infoBob, infoAlice, infoDylan];
    const multisig = await MultisigProgram.verifyUpdatePool(multi, info, array);
    const proof = new MultisigProof(multisig.proof);
    return proof;
  }

  async function getProofAccount(oldUser: PublicKey, newUser: PublicKey, delegator: boolean) {
    const time = Date.now();
    const info = new UpdateAccountInfo({ oldUser, newUser, deadline: UInt64.from(time) });

    const signBob = Signature.create(bobKey, info.toFields());
    const signAlice = Signature.create(aliceKey, info.toFields());
    const signDylan = Signature.create(dylanAccount.key, info.toFields());

    const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadline: UInt64.from(time) })
    const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right: allRight })
    const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right: allRight })
    const infoDylan = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan, right: allRight })
    const array = [infoBob, infoAlice, infoDylan];

    if (delegator) {
      const multisig1 = await MultisigProgram.verifyUpdateDelegator(multi, info, array);
      return new MultisigProof(multisig1.proof);
    }

    const multisig0 = await MultisigProgram.verifyUpdateProtocol(multi, info, array);
    return new MultisigProof(multisig0.proof);
  }

  it('update pool holder', async () => {
    const proof = await getProof(zkPoolAddress, TokenId.derive(zkTokenAddress), compileKey);
    const txn1 = await Mina.transaction(deployerAccount, async () => {
      await tokenHolder.updateVerificationKey(proof, compileKey);
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

    const proof = await getProofAccount(aliceAccount, deployerAccount, false);
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.setNewProtocol(proof, deployerAccount);
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

    const proofDelegator = await getProofAccount(dylanAccount, aliceAccount, true);

    // define a new delegator
    txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.setNewDelegator(proofDelegator, aliceAccount);
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
    const proofDelegator = await getProofAccount(dylanAccount, deployerAccount, true);

    // proof not match the new oyner
    await expect(Mina.transaction(senderAccount, async () => {
      await zkApp.setNewDelegator(proofDelegator, aliceAccount);
    })).rejects.toThrow();

  });


  it('deploy pool with first authorized account', async () => {
    const newPool = PrivateKey.random();
    const newPoolAddress = newPool.toPublicKey();
    const signature = Signature.create(bobKey, newPoolAddress.toFields());

    const witness = merkle.getWitness(Poseidon.hash(bobPublic.toFields()));

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, bobAccount, signature, witness, allRight);
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
    const witness = merkle.getWitness(Poseidon.hash(alicePublic.toFields()));

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, aliceAccount, signature, witness, allRight);
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
    const witness = merkle.getWitness(Poseidon.hash(senderPublic.toFields()));

    await expect(Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, senderAccount, signature, witness, signerRight);
    })).rejects.toThrow();

    // empty account failed too
    await expect(Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(newPoolAddress, zkToken2Address, PublicKey.empty(), signature, witness, signerRight);
    })).rejects.toThrow();

    /*merkle.setLeaf(2n, Poseidon.hash(senderAccount.toFields()));
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
    await txn3.sign([deployerKey, newPool]).send();*/
  });
});