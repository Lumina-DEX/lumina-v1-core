import { AccountUpdate, Bool, fetchAccount, Field, MerkleMap, Mina, Poseidon, PrivateKey, Provable, PublicKey, Signature, UInt32, UInt64, UInt8 } from 'o1js';


import { FungibleTokenAdmin, FungibleToken, mulDiv, PoolFactory, Pool, PoolTokenHolder } from '../index';
import { allRight, deployPoolRight, Multisig, MultisigInfo, SignatureInfo, UpdateSignerData, updateSignerRight } from '../pool/Multisig';

let proofsEnabled = false;

describe('Pool Factory Token', () => {
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
    senderPublic: PublicKey,
    dylanPublic: PublicKey,
    deployerPublic: PublicKey,
    bobPublic: PublicKey,
    alicePublic: PublicKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolFactory,
    zkPoolAddress: PublicKey,
    zkPoolPrivateKey: PrivateKey,
    zkPool: Pool,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress0: PublicKey,
    zkTokenPrivateKey0: PrivateKey,
    zkToken0: FungibleToken,
    zkTokenAddress1: PublicKey,
    zkTokenPrivateKey1: PrivateKey,
    zkToken1: FungibleToken,
    tokenHolder: PoolTokenHolder;

  beforeAll(async () => {
    const analyze = await Pool.analyzeMethods();
    getGates(analyze);

    if (proofsEnabled) {
      console.time('compile pool');
      await FungibleTokenAdmin.compile();
      await FungibleToken.compile();
      await PoolFactory.compile();
      await Pool.compile();
      await PoolTokenHolder.compile();
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
    // no transaction limits on zeko
    const Local = await Mina.LocalBlockchain({ proofsEnabled, enforceTransactionLimits: false });
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

    let keyTokenX = PrivateKey.random();
    let keyTokenY = PrivateKey.random();

    // order token to create pool
    let xIsLower = keyTokenX.toPublicKey().x.lessThan(keyTokenY.toPublicKey().x);

    zkTokenPrivateKey0 = xIsLower.toBoolean() ? keyTokenX : keyTokenY;
    zkTokenAddress0 = zkTokenPrivateKey0.toPublicKey();
    zkToken0 = new FungibleToken(zkTokenAddress0);

    zkTokenPrivateKey1 = xIsLower.toBoolean() ? keyTokenY : keyTokenX;
    zkTokenAddress1 = zkTokenPrivateKey1.toPublicKey();
    zkToken1 = new FungibleToken(zkTokenAddress1);

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken0.deriveTokenId());

    merkle = new MerkleMap();
    const allRightHash = Poseidon.hash(allRight.toFields());

    merkle = new MerkleMap();
    merkle.set(Poseidon.hash(bobPublic.toFields()), allRightHash);
    merkle.set(Poseidon.hash(alicePublic.toFields()), allRightHash);
    merkle.set(Poseidon.hash(senderPublic.toFields()), Poseidon.hash(updateSignerRight.toFields()));
    merkle.set(Poseidon.hash(deployerPublic.toFields()), Poseidon.hash(deployPoolRight.toFields()));
    merkle.set(Poseidon.hash(dylanPublic.toFields()), allRightHash);

    const root = merkle.getRoot();

    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrow = today.getTime();
    const time = getSlotFromTimestamp(tomorrow);
    const info = new UpdateSignerData({ oldRoot: Field.empty(), newRoot: root, deadlineSlot: UInt32.from(time) });

    const signBob = Signature.create(bobKey, info.toFields());
    const signAlice = Signature.create(aliceKey, info.toFields());

    const multi = new MultisigInfo({ approvedUpgrader: root, messageHash: info.hash(), deadlineSlot: UInt32.from(time) })
    const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right: allRight })
    const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right: allRight })
    const array = [infoBob, infoAlice];

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.deploy({
        symbol: "FAC", src: "https://luminadex.com/",
        protocol: aliceAccount,
        delegator: dylanAccount,
        approvedSigner: root,
        multisig: new Multisig({ info: multi, signatures: array })
      });
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount,
      });
      await zkToken0.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
      });
      await zkToken0.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false),
      )
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey0]).send();

    //deploy token 2
    const txn2 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2);
      await zkToken1.deploy({
        symbol: "LTB",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
      });
      await zkToken1.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false),
      )
    });
    await txn2.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn2.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey1]).send();

    const signature = Signature.create(bobKey, zkPoolAddress.toFields());
    const witness = merkle.getWitness(Poseidon.hash(bobPublic.toFields()));

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 5);
      await zkApp.createPoolToken(zkPoolAddress, zkTokenAddress0, zkTokenAddress1, bobAccount, signature, witness, allRight);
    });

    //console.log("Pool creation", txn3.toPretty());
    console.log("Pool creation au", txn3.transaction.accountUpdates.length);
    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send();

    // mint token to user
    await mintToken(senderAccount);

  });


  it('withdraw liquidity after swap', async () => {

    let amt = UInt64.from(50 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkPool.supplyFirstLiquiditiesToken(amt, amtToken);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const reserveIn = Mina.getBalance(zkPoolAddress, zkToken1.deriveTokenId());
    const reserveOut = Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId());
    let amountIn = UInt64.from(5 * 10 ** 9);

    const balanceMin = reserveOut.sub(reserveOut.div(100));
    const balanceMax = reserveIn.add(reserveIn.div(100));

    const protocol = await zkApp.getProtocol();
    const txn2 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await tokenHolder.swapFromTokenToToken(protocol, UInt64.from(5), amountIn, UInt64.from(1), balanceMax, balanceMin);
      await zkToken0.approveAccountUpdate(tokenHolder.self);
    });
    console.log("swap from token", txn2.toPretty());
    console.log("swap from token au", txn2.transaction.accountUpdates.length);
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const supply = await Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId());

    const balPool0 = await Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId());
    const balPool1 = await Mina.getBalance(zkPoolAddress, zkToken1.deriveTokenId());

    await Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
    await Mina.getBalance(senderAccount, zkToken1.deriveTokenId());
    await Mina.getBalance(senderAccount, zkPool.deriveTokenId());

    const liquityOut = UInt64.from(1 * 10 ** 9);
    const amountMinaOut = mulDiv(liquityOut, balPool0, supply);
    const amountTokenOut = mulDiv(liquityOut, balPool1, supply);
    await fetchAccount({ publicKey: senderAccount });
    await fetchAccount({ publicKey: senderAccount });
    txn = await Mina.transaction(senderAccount, async () => {
      await tokenHolder.withdrawLiquidityToken(liquityOut, amountMinaOut, amountTokenOut, balPool0, balPool1, supply);
      await zkToken0.approveAccountUpdate(tokenHolder.self);
    });
    console.log("Withdraw liquidity token", txn.toPretty());

    await txn.prove();
    await txn.sign([senderKey]).send();


  });


  it('withdraw liquidity after swap token 1', async () => {

    let amt = UInt64.from(50 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await zkPool.supplyFirstLiquiditiesToken(amt, amtToken);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const reserveIn = Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId());
    const reserveOut = Mina.getBalance(zkPoolAddress, zkToken1.deriveTokenId());
    let amountIn = UInt64.from(5 * 10 ** 9);

    const balanceMin = reserveOut.sub(reserveOut.div(100));
    const balanceMax = reserveIn.add(reserveIn.div(100));

    const protocol = await zkApp.getProtocol();
    const tokenHolder2 = new PoolTokenHolder(zkPoolAddress, zkToken1.deriveTokenId());
    const txn2 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1);
      await tokenHolder2.swapFromTokenToToken(protocol, UInt64.from(5), amountIn, UInt64.from(1), balanceMax, balanceMin);
      await zkToken1.approveAccountUpdate(tokenHolder2.self);
    });
    console.log("swap from token", txn2.toPretty());
    console.log("swap from token au", txn2.transaction.accountUpdates.length);
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const supply = await Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId());

    const balPool0 = await Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId());
    const balPool1 = await Mina.getBalance(zkPoolAddress, zkToken1.deriveTokenId());

    const liquityOut = UInt64.from(1 * 10 ** 9);
    const amountMinaOut = mulDiv(liquityOut, balPool0, supply);
    const amountTokenOut = mulDiv(liquityOut, balPool1, supply);
    txn = await Mina.transaction(senderAccount, async () => {
      await tokenHolder.withdrawLiquidityToken(liquityOut, amountMinaOut, amountTokenOut, balPool0, balPool1, supply);
      await zkToken0.approveAccountUpdate(tokenHolder.self);
    });

    await txn.prove();
    await txn.sign([senderKey]).send();


  });


  async function getReserves(poolAddress: PublicKey) {
    const acc = await fetchAccount({ publicKey: poolAddress });
    const zkPool = new Pool(poolAddress);
    const token0 = await zkPool.token0.fetch();
    const token = await zkPool.token1.fetch();
    const zkToken0 = new FungibleToken(token0!);
    const zkToken = new FungibleToken(token!);
    const accToken = await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() });
    const accLiquidity = await fetchAccount({ publicKey: poolAddress, tokenId: zkPool.deriveTokenId() });

    return {
      amountToken: Mina.getBalance(poolAddress, zkToken.deriveTokenId()),
      amountMina: Mina.getBalance(poolAddress, zkToken0.deriveTokenId()),
      liquidity: Mina.getBalance(poolAddress, zkPool.deriveTokenId())
    };
  }

  async function mintToken(user: PublicKey) {
    // token are minted to original deployer, so just transfer it for test
    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken0.mint(user, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkTokenPrivateKey0]).send();

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken0.mint(deployerAccount, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkTokenPrivateKey0]).send();

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken1.mint(user, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkTokenPrivateKey1]).send();

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken1.mint(deployerAccount, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkTokenPrivateKey1]).send();

  }

  function getSlotFromTimestamp(date: number) {
    const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
    let slotCalculated = UInt64.from(date);
    slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime);
    Provable.log("slotCalculated64", slotCalculated);
    return slotCalculated.toUInt32();
  }
});