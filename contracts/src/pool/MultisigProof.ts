import { AccountUpdate, Bool, Field, MerkleMap, MerkleMapWitness, method, Poseidon, Provable, PublicKey, Signature, SmartContract, state, State, Struct, TokenId, UInt64, VerificationKey, ZkProgram } from 'o1js';

export class MultisigInfo extends Struct({
    approvedUpgrader: Field,
    contractAddress: PublicKey,
    tokenId: Field,
    oldVkHash: Field,
    newVkHash: Field
}) {
    constructor(value: {
        approvedUpgrader: Field,
        contractAddress: PublicKey,
        tokenId: Field,
        oldVkHash: Field,
        newVkHash: Field
    }) {
        super(value);
    }

    toFields(): Field[] {
        return this.approvedUpgrader.toFields().concat(
            this.contractAddress.toFields().concat(
                this.tokenId.toFields().concat(
                    this.oldVkHash.toFields().concat(
                        this.newVkHash.toFields()
                    )
                )
            ));
    }
}

export class SignatureInfo extends Struct({
    user: PublicKey,
    witness: MerkleMapWitness,
    signature: Signature
}) {
    constructor(value: {
        user: PublicKey,
        witness: MerkleMapWitness,
        signature: Signature
    }) {
        super(value);
    }

    validate(info: MultisigInfo): Bool {
        const hashUser = Poseidon.hash(this.user.toFields());
        const [root, key] = this.witness.computeRootAndKey(hashUser);
        root.assertEquals(info.approvedUpgrader, "Invalid signer");
        key.assertEquals(hashUser, "Invalid key");
        return this.signature.verify(this.user, info.toFields());
    }
}

export const MultisigProgram = ZkProgram({
    name: 'multisig',
    publicInput: MultisigInfo,

    methods: {

        verifySignature: {
            privateInputs: [Provable.Array(SignatureInfo, 3)],

            async method(
                info: MultisigInfo,
                signatures: SignatureInfo[]
            ) {
                signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer");
                signatures[1].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                for (let index = 0; index < signatures.length; index++) {
                    const element = signatures[index];
                    const valid = element.validate(info);
                    valid.assertTrue("Invalid signature");
                }
            },
        },
    },
});