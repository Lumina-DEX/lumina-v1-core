import { Field, MerkleMap, Cache, Mina, Poseidon, PrivateKey, Provable, PublicKey, Signature, UInt32, UInt64, VerificationKey, Bool, AccountUpdate, UInt8 } from 'o1js';
import { MultisigInfo, Multisig, SignatureInfo, SignatureRight, UpdateSignerData, UpdateAccountInfo, UpdateFactoryInfo, MultisigSigner } from '../pool/Multisig';
import { FungibleTokenAdmin, FungibleToken } from 'mina-fungible-token';
import { PoolFactory, Pool, PoolTokenHolder } from '../indexpool';
import { PoolUpgradeTest } from './PoolUpgradeTest';
import { PoolIntermediary } from './PoolIntermediary';

const proofsEnabled = true;

const vkUpgradeTest = new VerificationKey({
    data: "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",
    hash: Field.from(1094855669395027188090902596744887124365128625005606285591537108109825582697n)
});

const vkFactoryUpgradeTest = new VerificationKey({
    data: "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",
    hash: Field.from(16987087617894989826548935123876684212487474304228350486554612210262558959759n)
});


describe('Pool data', () => {
    let deployerAccount: Mina.TestPublicKey,
        deployerKey: PrivateKey,
        senderAccount: Mina.TestPublicKey,
        senderKey: PrivateKey,
        senderPublic: PublicKey,
        bobAccount: Mina.TestPublicKey,
        bobPublic: PublicKey,
        bobKey: PrivateKey,
        deployer2: Mina.TestPublicKey,
        deployer3: Mina.TestPublicKey,
        aliceAccount: Mina.TestPublicKey,
        alicePublic: PublicKey,
        dylanAccount: Mina.TestPublicKey,
        dylanPublic: PublicKey,
        deployerPublic: PublicKey,
        deployer2Public: PublicKey,
        deployer3Public: PublicKey,
        aliceKey: PrivateKey,
        allRight: SignatureRight,
        signerRight: SignatureRight,
        deployRight: SignatureRight,
        updatePoolRight: SignatureRight,
        updateDelegatorRight: SignatureRight,
        updateSignerRight: SignatureRight,
        updateProtocolRight: SignatureRight,
        updateFactoryRight: SignatureRight,
        deployerRight: SignatureRight,
        merkle: MerkleMap,
        compileKey: VerificationKey,
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
        tokenHolder: PoolTokenHolder;


    beforeAll(async () => {
        compileKey = vkUpgradeTest;

        const cache = Cache.FileSystem('./cache');
        // const compileResult = await PoolUpgradeTest.compile({ cache, });

        // console.log("poolUpgradeTest", compileResult.verificationKey.data);
        // console.log("poolUpgradeTest hash", compileResult.verificationKey.hash.toBigInt());

        if (proofsEnabled) {
            console.time('compile PoolData');
            await FungibleTokenAdmin.compile({ cache });
            await FungibleToken.compile({ cache });
            await PoolFactory.compile({ cache });
            await Pool.compile({ cache });
            await PoolIntermediary.compile({ cache });
            await PoolTokenHolder.compile({ cache });
            console.timeEnd('compile PoolData');
        }

        allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true));
        deployerRight = new SignatureRight(Bool(true), Bool(false), Bool(true), Bool(false), Bool(false), Bool(false));
        updatePoolRight = SignatureRight.canUpdatePool();
        updateDelegatorRight = SignatureRight.canUpdateDelegator();
        updateSignerRight = SignatureRight.canUpdateSigner();
        updateProtocolRight = SignatureRight.canUpdateProtocol();
        updateFactoryRight = SignatureRight.canUpdateFactory();
        signerRight = SignatureRight.canUpdateSigner();
        deployRight = SignatureRight.canDeployPool();
    });

    beforeEach(async () => {
        const Local = await Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        [deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount, deployer2, deployer3] = Local.testAccounts;
        deployerKey = deployerAccount.key;
        senderKey = senderAccount.key;

        senderPublic = senderKey.toPublicKey()
        dylanPublic = dylanAccount.key.toPublicKey()
        bobKey = bobAccount.key;
        bobPublic = bobKey.toPublicKey();
        aliceKey = aliceAccount.key;
        alicePublic = aliceKey.toPublicKey();
        deployerPublic = deployerKey.toPublicKey();
        deployer2Public = deployer2.key.toPublicKey();
        deployer3Public = deployer3.key.toPublicKey();

        merkle = new MerkleMap();
        merkle.set(Poseidon.hash(deployerPublic.toFields()), allRight.hash());
        merkle.set(Poseidon.hash(deployer2Public.toFields()), updateSignerRight.hash());
        merkle.set(Poseidon.hash(deployer3Public.toFields()), updateSignerRight.hash())


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


        const txn = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount, 3);
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
    });

    async function deployPool() {

        const root = merkle.getRoot();

        const today = new Date();
        today.setDate(today.getDate() + 1);
        const tomorrow = today.getTime();
        const time = getSlotFromTimestamp(tomorrow);
        const info = new UpdateSignerData({ oldRoot: Field.empty(), newRoot: root, deadlineSlot: UInt32.from(time) });

        const sign1 = Signature.create(deployerKey, info.toFields());
        const sign2 = Signature.create(deployer2.key, info.toFields());
        const sign3 = Signature.create(deployer3.key, info.toFields());

        const multi = new MultisigInfo({ approvedUpgrader: root, messageHash: info.hash(), deadlineSlot: UInt32.from(time) })
        const info1 = new SignatureInfo({ user: deployerPublic, witness: merkle.getWitness(Poseidon.hash(deployerPublic.toFields())), signature: sign1, right: allRight })
        const info2 = new SignatureInfo({ user: deployer2Public, witness: merkle.getWitness(Poseidon.hash(deployer2Public.toFields())), signature: sign2, right: updateSignerRight })
        const info3 = new SignatureInfo({ user: deployer3Public, witness: merkle.getWitness(Poseidon.hash(deployer3Public.toFields())), signature: sign3, right: updateSignerRight })
        const signatures = [info1, info2, info3];

        const txn = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount, 1);
            await zkApp.deploy({
                symbol: "FAC", src: "https://luminadex.com/",
                protocol: aliceAccount,
                delegator: dylanAccount,
                approvedSigner: root,
                signatures: signatures,
                multisigInfo: multi
            });
        });
        await txn.prove();
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey]).send();

        const signature = Signature.create(deployerKey, zkPoolAddress.toFields());
        const witness = merkle.getWitness(Poseidon.hash(deployerPublic.toFields()));
        const txn3 = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount, 4);
            await zkApp.createPool(zkPoolAddress, zkTokenAddress, deployerAccount, signature, witness, allRight);
        });

        //console.log("Pool creation au", txn3.transaction.accountUpdates.length);
        await txn3.prove();
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn3.sign([deployerKey, zkPoolPrivateKey]).send();
    }

    it('update pool proof', async () => {

        const right = updateFactoryRight;
        merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash());

        await deployPool();

        const today = new Date();
        today.setDate(today.getDate() + 1);
        const tomorrow = today.getTime();
        const time = getSlotFromTimestamp(tomorrow);
        const info = new UpdateFactoryInfo({ newVkHash: vkFactoryUpgradeTest.hash, deadlineSlot: UInt32.from(time) });

        Provable.log("info validate", info.toFields());
        Provable.log("bob", bobPublic);
        const signBob = Signature.create(bobKey, info.toFields());
        const signAlice = Signature.create(aliceKey, info.toFields());
        const signDylan = Signature.create(dylanAccount.key, info.toFields());

        const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadlineSlot: UInt32.from(time) })
        const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right })
        const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right })
        const infoDylan = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan, right })
        const array = [infoBob, infoAlice, infoDylan];

        const proof = new Multisig({ info: multi, signatures: array });
        const txn = await Mina.transaction(deployerAccount, async () => {
            await zkApp.updateVerificationKey(proof, vkFactoryUpgradeTest);
        });
        await txn.prove();
        await txn.sign([deployerKey]).send();

        const newPool2 = new PoolUpgradeTest(zkTokenAddress);
        const version2 = await newPool2.version();

        const newZkPool = new PoolIntermediary(zkPoolAddress);
        expect(version2.value).toEqual(UInt64.from(66).value);

        const txn2 = await Mina.transaction(deployerAccount, async () => {
            await newZkPool.updateVerificationKey();
        });
        await txn2.prove();
        await txn2.sign([deployerKey]).send();

        const newPool = new PoolUpgradeTest(zkTokenAddress);
        const version = await newPool.version();
        expect(version.value).toEqual(UInt64.from(66).value);
    });


    it('update delegator', async () => {
        merkle.set(Poseidon.hash(bobPublic.toFields()), updateDelegatorRight.hash());
        merkle.set(Poseidon.hash(alicePublic.toFields()), updateDelegatorRight.hash());
        merkle.set(Poseidon.hash(dylanPublic.toFields()), updateDelegatorRight.hash());
        merkle.set(Poseidon.hash(senderPublic.toFields()), updateDelegatorRight.hash());

        await deployPool();

        const pk = PrivateKey.random();
        const oldAccount = await zkApp.delegator.fetch();
        const pkNew = PrivateKey.random();
        const newAccount = pkNew.toPublicKey();
        const today = new Date();
        today.setDate(today.getDate() + 1);
        const tomorrow = today.getTime();
        const time = getSlotFromTimestamp(tomorrow);
        const info = new UpdateAccountInfo({ oldUser: oldAccount!, newUser: newAccount, deadlineSlot: UInt32.from(time) });


        Provable.log("info validate", info.toFields());
        Provable.log("bob", bobPublic);
        const signBob = Signature.create(bobKey, info.toFields());
        const signAlice = Signature.create(aliceKey, info.toFields());
        const signDylan = Signature.create(dylanAccount.key, info.toFields());

        const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadlineSlot: UInt32.from(time) })
        const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right: updateDelegatorRight })
        const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right: updateDelegatorRight })
        const infoDylan = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan, right: updateDelegatorRight })
        const array = [infoBob, infoAlice, infoDylan];

        const proof = new Multisig({ info: multi, signatures: array });
        const txn = await Mina.transaction(deployerAccount, async () => {
            await zkApp.setNewDelegator(proof, newAccount);
        });
        await txn.prove();
        await txn.sign([deployerKey]).send();

    });

    it('update protocol', async () => {
        const right = updateProtocolRight;
        merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash());

        await deployPool();

        const pk = PrivateKey.random();
        const oldAccount = await zkApp.protocol.fetch();
        const pkNew = PrivateKey.random();
        const newAccount = pkNew.toPublicKey();
        const today = new Date();
        today.setDate(today.getDate() + 1);
        const tomorrow = today.getTime();
        const time = getSlotFromTimestamp(tomorrow);
        const info = new UpdateAccountInfo({ oldUser: oldAccount!, newUser: newAccount, deadlineSlot: UInt32.from(time) });


        Provable.log("info validate", info.toFields());
        Provable.log("bob", bobPublic);
        const signBob = Signature.create(bobKey, info.toFields());
        const signAlice = Signature.create(aliceKey, info.toFields());
        const signDylan = Signature.create(dylanAccount.key, info.toFields());

        const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadlineSlot: UInt32.from(time) })
        const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right })
        const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right })
        const infoDylan = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan, right })
        const array = [infoBob, infoAlice, infoDylan];

        const proof = new Multisig({ info: multi, signatures: array });
        const txn = await Mina.transaction(deployerAccount, async () => {
            await zkApp.setNewProtocol(proof, newAccount);
        });
        await txn.prove();
        await txn.sign([deployerKey]).send();
    });

    it('update factory', async () => {
        const right = updateFactoryRight;
        merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash());

        await deployPool();

        const today = new Date();
        today.setDate(today.getDate() + 1);
        const tomorrow = today.getTime();
        const time = getSlotFromTimestamp(tomorrow);
        const info = new UpdateFactoryInfo({ newVkHash: vkUpgradeTest.hash, deadlineSlot: UInt32.from(time) });

        Provable.log("info validate", info.toFields());
        Provable.log("bob", bobPublic);
        const signBob = Signature.create(bobKey, info.toFields());
        const signAlice = Signature.create(aliceKey, info.toFields());
        const signDylan = Signature.create(dylanAccount.key, info.toFields());

        const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadlineSlot: UInt32.from(time) })
        const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right })
        const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right })
        const infoDylan = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan, right })
        const array = [infoBob, infoAlice, infoDylan];

        const proof = new Multisig({ info: multi, signatures: array });
        const txn = await Mina.transaction(deployerAccount, async () => {
            await zkApp.updateVerificationKey(proof, vkUpgradeTest);
        });
        await txn.prove();
        await txn.sign([deployerKey]).send();

    });

    it('update signer', async () => {
        const right = updateSignerRight;
        merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash());
        merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash());

        await deployPool();

        const newMerkle = new MerkleMap();
        newMerkle.set(Poseidon.hash(bobPublic.toFields()), right.hash());
        newMerkle.set(Poseidon.hash(alicePublic.toFields()), right.hash());
        newMerkle.set(Poseidon.hash(deployerAccount.toFields()), right.hash());

        const today = new Date();
        today.setDate(today.getDate() + 1);
        const tomorrow = today.getTime();
        const time = getSlotFromTimestamp(tomorrow);
        const info = new UpdateSignerData({ oldRoot: merkle.getRoot(), newRoot: newMerkle.getRoot(), deadlineSlot: UInt32.from(time) });


        Provable.log("info validate", info.toFields());
        Provable.log("bob", bobPublic);
        const signBob = Signature.create(bobKey, info.toFields());
        const signAlice = Signature.create(aliceKey, info.toFields());
        const signDylan = Signature.create(dylanAccount.key, info.toFields());

        const deployerPublic = deployerAccount.key.toPublicKey();
        const newsignBob = Signature.create(bobKey, info.toFields());
        const newsignAlice = Signature.create(aliceKey, info.toFields());
        const newsignDeployer = Signature.create(deployerAccount.key, info.toFields());


        const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadlineSlot: UInt32.from(time) })
        const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right })
        const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right })
        const infoDylan = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan, right })
        const array = [infoBob, infoAlice, infoDylan];

        const newinfoBob = new SignatureInfo({ user: bobPublic, witness: newMerkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: newsignBob, right })
        const newinfoAlice = new SignatureInfo({ user: alicePublic, witness: newMerkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: newsignAlice, right })
        const newinfoDeployer = new SignatureInfo({ user: deployerPublic, witness: newMerkle.getWitness(Poseidon.hash(deployerPublic.toFields())), signature: newsignDeployer, right })
        const newarray = [newinfoBob, newinfoAlice, newinfoDeployer];

        const proof = new MultisigSigner({ info: multi, signatures: array, newSignatures: newarray });
        const txn = await Mina.transaction(deployerAccount, async () => {
            await zkApp.updateApprovedSigner(proof, newMerkle.getRoot());
        });
        await txn.prove();
        await txn.sign([deployerKey]).send();

    });

    function getSlotFromTimestamp(date: number) {
        const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
        let slotCalculated = UInt64.from(date);
        slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime);
        Provable.log("slotCalculated64", slotCalculated);
        return slotCalculated.toUInt32();
    }
});