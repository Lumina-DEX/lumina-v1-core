import { Field, MerkleMap, Mina, Poseidon, PrivateKey, Provable, PublicKey, Signature, TokenId, UInt64 } from 'o1js';
import { MultisigInfo, MultisigProgram, SignatureInfo, SignatureRight, UpgradeInfo } from '../pool/MultisigProof';

const proofsEnabled = false;


describe('Pool data', () => {
    let deployerAccount: Mina.TestPublicKey,
        deployerKey: PrivateKey,
        senderAccount: Mina.TestPublicKey,
        senderKey: PrivateKey,
        senderPublic: PublicKey,
        bobAccount: Mina.TestPublicKey,
        bobPublic: PublicKey,
        bobKey: PrivateKey,
        aliceAccount: Mina.TestPublicKey,
        alicePublic: PublicKey,
        dylanAccount: Mina.TestPublicKey,
        dylanPublic: PublicKey,
        aliceKey: PrivateKey,
        updatePoolRight: SignatureRight,
        merkle: MerkleMap;


    beforeAll(async () => {
        await MultisigProgram.compile({ proofsEnabled });

        updatePoolRight = SignatureRight.canUpdatePool();
    });

    beforeEach(async () => {
        const Local = await Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        [deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount] = Local.testAccounts;
        deployerKey = deployerAccount.key;
        senderKey = senderAccount.key;

        senderPublic = senderKey.toPublicKey()
        dylanPublic = dylanAccount.key.toPublicKey()
        bobKey = bobAccount.key;
        bobPublic = bobKey.toPublicKey();
        aliceKey = aliceAccount.key;
        alicePublic = aliceKey.toPublicKey();

        merkle = new MerkleMap();
        merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash());
        merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash());
        merkle.set(Poseidon.hash(dylanPublic.toFields()), updatePoolRight.hash());
        merkle.set(Poseidon.hash(senderPublic.toFields()), updatePoolRight.hash());

    });

    it('multisig is valid', async () => {

        const pk = PrivateKey.random();
        const contractAddress = pk.toPublicKey();
        const tokenId = TokenId.derive(contractAddress);
        const time = Date.now();
        const info = new UpgradeInfo({ contractAddress, tokenId, newVkHash: Field(33), deadline: UInt64.from(time) });


        Provable.log("info validate", info.toFields());
        Provable.log("bob", bobPublic);
        const signBob = Signature.create(bobKey, info.toFields());
        const signAlice = Signature.create(aliceKey, info.toFields());
        const signDylan = Signature.create(dylanAccount.key, info.toFields());

        const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadline: UInt64.from(time) })
        const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob, right: updatePoolRight })
        const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice, right: updatePoolRight })
        const infoDylan = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan, right: updatePoolRight })
        const array = [infoBob, infoAlice, infoDylan];
        const multisig = await MultisigProgram.verifyUpdatePool(multi, info, array);

        await multisig.proof.verify();
    });



});