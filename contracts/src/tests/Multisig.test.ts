import { Field, MerkleMap, Mina, Poseidon, PrivateKey, Provable, PublicKey, Signature, TokenId, UInt64 } from 'o1js';
import { MultisigInfo, MultisigProgram, SignatureInfo, UpgradeInfo } from '../pool/MultisigProof';

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
        merkle: MerkleMap;


    beforeAll(async () => {
        await MultisigProgram.compile({ proofsEnabled });
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
        merkle.set(Poseidon.hash(bobPublic.toFields()), Poseidon.hash(bobPublic.toFields()));
        merkle.set(Poseidon.hash(alicePublic.toFields()), Poseidon.hash(alicePublic.toFields()));
        merkle.set(Poseidon.hash(dylanPublic.toFields()), Poseidon.hash(dylanPublic.toFields()));
        merkle.set(Poseidon.hash(senderPublic.toFields()), Poseidon.hash(senderPublic.toFields()));

    });

    it('multisig is valid', async () => {

        const pk = PrivateKey.random();
        const contractAddress = pk.toPublicKey();
        const tokenId = TokenId.derive(contractAddress);
        const time = Date.now();
        const info = new UpgradeInfo({ contractAddress, tokenId, newVkHash: Field(33), deadline: UInt64.from(time) });

        Provable.log("info validate", info.toFields());
        Provable.log("bob", bobPublic);
        const signBob = Signature.create(bobKey, info.hash().toFields());
        const signAlice = Signature.create(aliceKey, info.hash().toFields());
        const signDylan = Signature.create(dylanAccount.key, info.hash().toFields());

        const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash() })
        const infoBob = new SignatureInfo({ user: bobPublic, witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())), signature: signBob })
        const infoAlice = new SignatureInfo({ user: alicePublic, witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())), signature: signAlice })
        const infoDylqn = new SignatureInfo({ user: dylanPublic, witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())), signature: signDylan })
        const array = [infoBob, infoAlice, infoDylqn];
        const multisig = await MultisigProgram.verifyUpgradeSignature(multi, array);

        await multisig.proof.verify();
    });



});