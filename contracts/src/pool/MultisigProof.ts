import { AccountUpdate, Bool, Field, MerkleMap, MerkleMapWitness, method, Poseidon, Provable, PublicKey, Signature, SmartContract, state, State, Struct, TokenId, UInt64, VerificationKey, ZkProgram } from 'o1js';

export class UpgradeInfo extends Struct({
    // merkle root of account who can sign to upgrade
    approvedUpgrader: Field,
    // contract to upgrade
    contractAddress: PublicKey,
    // subaccount to upgrade
    tokenId: Field,
    // current contract verification key hash
    oldVkHash: Field,
    // new verification key hash to submit
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

    /**
     * Data use to create the signature
     * @returns array of field of all parameters
     */
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
    // signer account
    user: PublicKey,
    // witness of this account in the merkle root
    witness: MerkleMapWitness,
    // signature created by this user
    signature: Signature
}) {
    constructor(value: {
        user: PublicKey,
        witness: MerkleMapWitness,
        signature: Signature
    }) {
        super(value);
    }

    /**
     * Check if the signature match the current user and data subnit
     * @param merkle list of approved signer
     * @param data data use for the signature
     * @returns true if the signature is valid
     */
    validate(merkle: Field, data: Field[]): Bool {
        const hashUser = Poseidon.hash(this.user.toFields());
        const [root, key] = this.witness.computeRootAndKey(hashUser);
        root.assertEquals(merkle, "Invalid signer");
        key.assertEquals(hashUser, "Invalid key");
        return this.signature.verify(this.user, data);
    }
}

export const MultisigProgram = ZkProgram({
    name: 'multisig',
    publicInput: UpgradeInfo,

    methods: {

        verifyUpgradeSignature: {
            privateInputs: [Provable.Array(SignatureInfo, 3)],

            async method(
                info: UpgradeInfo,
                signatures: SignatureInfo[]
            ) {
                // check the signature come from 3 different users
                signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer");
                signatures[1].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                signatures[0].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                for (let index = 0; index < signatures.length; index++) {
                    const element = signatures[index];
                    // verfify the signature validity for all users
                    const valid = element.validate(info.approvedUpgrader, info.toFields());
                    valid.assertTrue("Invalid signature");
                }
            },
        },
    },
});