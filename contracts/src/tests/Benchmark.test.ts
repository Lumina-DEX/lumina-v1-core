import { AccountUpdate, Bool, Cache, fetchAccount, Field, MerkleMap, Mina, Poseidon, PrivateKey, PublicKey, Signature, UInt32, UInt64, UInt8 } from 'o1js';


import { FungibleTokenAdmin, FungibleToken, mulDiv, PoolFactory, PoolTokenHolder, Pool } from '../index';
import { MultisigInfo, SignatureInfo, SignatureRight, UpdateSignerData } from '../pool/Multisig';

let proofsEnabled = true;

describe('Benchmark', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    merkle: MerkleMap,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    dylanAccount: Mina.TestPublicKey,
    bobPublic: PublicKey,
    alicePublic: PublicKey,
    dylanPublic: PublicKey,
    senderPublic: PublicKey,
    deployerPublic: PublicKey,
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
    tokenHolder: PoolTokenHolder,
    Local: any;

  beforeAll(async () => {
    const cache = Cache.FileSystem('./cache');
    if (proofsEnabled) {

      console.time('compile contracts');
      console.time('compile fta');
      await FungibleTokenAdmin.compile({ cache });
      console.timeEnd('compile fta')
      console.time('compile ft')
      await FungibleToken.compile({ cache });
      console.timeEnd('compile ft')
      console.time('compile pf')
      await PoolFactory.compile({ cache });
      console.timeEnd('compile pf')
      console.time('compile pool')
      await Pool.compile({ cache });
      console.timeEnd('compile pool')
      console.time('compile pth')
      await PoolTokenHolder.compile({ cache });
      console.timeEnd('compile pth')
      console.timeEnd('compile contracts');
    }

    Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;
    bobKey = bobAccount.key;
    aliceKey = aliceAccount.key;

    senderPublic = senderKey.toPublicKey();
    bobPublic = bobKey.toPublicKey();
    alicePublic = aliceKey.toPublicKey();
    dylanPublic = dylanAccount.key.toPublicKey();
    deployerPublic = deployerKey.toPublicKey();

    allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true));
    deployRight = SignatureRight.canDeployPool();

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

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken.deriveTokenId());

    merkle = new MerkleMap();
    merkle.set(Poseidon.hash(bobPublic.toFields()), allRight.hash());
    merkle.set(Poseidon.hash(alicePublic.toFields()), allRight.hash());
    merkle.set(Poseidon.hash(senderPublic.toFields()), allRight.hash());
    merkle.set(Poseidon.hash(deployerPublic.toFields()), deployRight.hash());

    const root = merkle.getRoot();

    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrow = today.getTime();
    const time = getSlotFromTimestamp(tomorrow);

    const info = new UpdateSignerData({ oldRoot: Field.empty(), newRoot: root, deadlineSlot: UInt32.from(time) });

    const signBob = Signature.create(bobKey, info.toFields());
    const signAlice = Signature.create(aliceKey, info.toFields());
    const signDylan = Signature.create(senderAccount.key, info.toFields());

    const multi = new MultisigInfo({ approvedUpgrader: root, messageHash: info.hash(), deadlineSlot: UInt32.from(time) })
    const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right: allRight })
    const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right: allRight })
    const infoDylan = new SignatureInfo({ user: senderPublic, witness: merkle.getWitness(Poseidon.hash(senderPublic.toFields())), signature: signDylan, right: allRight })
    const array = [infoBob, infoAlice, infoDylan];

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.deploy({ symbol: "FAC", signatures: array, multisigInfo: multi, src: "https://luminadex.com/", protocol: aliceAccount, delegator: dylanAccount, approvedSigner: root });
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

    const signature = Signature.create(bobKey, zkPoolAddress.toFields());
    const witness = merkle.getWitness(Poseidon.hash(bobPublic.toFields()));
    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(zkPoolAddress, zkTokenAddress, bobAccount, signature, witness, allRight);
    });

    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send();

    // mint token to user
    await mintToken(senderAccount);

    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    const txn4 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkPool.supplyFirstLiquidities(amt, amtToken);
    });
    await txn4.prove();
    await txn4.sign([senderKey]).send();
  });


  async function getReserves(poolAddress: PublicKey) {
    const acc = await fetchAccount({ publicKey: poolAddress });
    const zkPool = new Pool(poolAddress);
    const token = await zkPool.token1.fetch();
    const zkToken = new FungibleToken(token!);
    const accToken = await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() });
    const accLiquidity = await fetchAccount({ publicKey: poolAddress, tokenId: zkPool.deriveTokenId() });

    return {
      amountToken: Mina.getBalance(poolAddress, zkToken.deriveTokenId()),
      amountMina: Mina.getBalance(poolAddress),
      liquidity: Mina.getBalance(poolAddress, zkPool.deriveTokenId())
    };
  }


  it('swap from mina', async () => {

    let amountIn = UInt64.from(1.3 * 10 ** 9);

    const reserveIn = Mina.getBalance(zkPoolAddress);
    const reserveOut = Mina.getBalance(zkPoolAddress, zkToken.deriveTokenId());

    const balBefore = Mina.getBalance(senderAccount, zkToken.deriveTokenId());

    const balanceMin = reserveOut.sub(reserveOut.div(100));
    const balanceMax = reserveIn.add(reserveIn.div(100));

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));
    const optimalOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn));

    const dif = optimalOut.sub(expectedOut);

    console.time('swap from mina');
    const txn2 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 2);
      await tokenHolder.swapFromMinaToToken(bobAccount, UInt64.from(6), amountIn, UInt64.from(1), balanceMax, balanceMin);
      await zkToken.approveAccountUpdate(tokenHolder.self);
    });
    console.log("swap from mina", txn2.toPretty());
    await txn2.prove();
    console.timeEnd('swap from mina');
    await txn2.sign([senderKey]).send();
  });

  it('swap from token', async () => {
    const reserveIn = Mina.getBalance(zkPoolAddress, zkToken.deriveTokenId());
    const reserveOut = Mina.getBalance(zkPoolAddress);
    let amountIn = UInt64.from(1.3 * 10 ** 9);

    const balanceMin = reserveOut.sub(reserveOut.div(100));
    const balanceMax = reserveIn.add(reserveIn.div(100));

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));
    const optimalOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn));

    const minOut = optimalOut.sub(optimalOut.div(50)); // 2 % dif 

    const balBefore = Mina.getBalance(senderAccount, zkToken.deriveTokenId());

    const userMinaBalBefore = Mina.getBalance(senderAccount);

    console.time('swap from token');
    const txn2 = await Mina.transaction(senderAccount, async () => {
      await zkPool.swapFromTokenToMina(bobAccount, UInt64.from(6), amountIn, UInt64.from(1), balanceMax, balanceMin);
    });
    console.log("swap from token", txn2.toPretty());
    await txn2.prove();
    console.timeEnd('swap from token');
    await txn2.sign([senderKey]).send();

    const balAfter = Mina.getBalance(senderAccount, zkToken.deriveTokenId());
    expect(balAfter.value).toEqual(balBefore.sub(amountIn).value);
  });

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

  function getSlotFromTimestamp(date: number) {
    const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
    let slotCalculated = UInt64.from(date);
    slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime);
    return slotCalculated.toUInt32();
  }
});