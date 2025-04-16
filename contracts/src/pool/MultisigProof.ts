import { Bool, Field, MerkleMapWitness, Poseidon, Provable, PublicKey, Signature, Struct, UInt64, ZkProgram } from 'o1js';


export class SignatureRight extends Struct({
    deployPool: Bool,
    uppdatePool: Bool,
    updateSigner: Bool,
    updateProtocol: Bool,
    updateDelegator: Bool
}) {
    constructor(deployPool: Bool,
        uppdatePool: Bool,
        updateSigner: Bool,
        updateProtocol: Bool,
        updateDelegator: Bool) {
        super({
            deployPool,
            uppdatePool,
            updateSigner,
            updateProtocol,
            updateDelegator
        });
    }

    toFields(): Field[] {
        return this.deployPool.toFields().concat(
            this.uppdatePool.toFields().concat(
                this.updateSigner.toFields().concat(
                    this.updateProtocol.toFields().concat(
                        this.updateDelegator.toFields()))));
    }

    static canUpdatePool(): SignatureRight {
        return new SignatureRight(Bool(false), Bool(true), Bool(false), Bool(false), Bool(false))
    }

    // hash store in the signer merkle map
    hash(): Field {
        return Poseidon.hash(this.toFields());
    }
}


export class UpgradeInfo extends Struct({
    // contract to upgrade
    contractAddress: PublicKey,
    // subaccount to upgrade
    tokenId: Field,
    // new verification key hash to submit
    newVkHash: Field,
    // deadline to use this signature
    deadline: UInt64
}) {
    constructor(value: {
        contractAddress: PublicKey,
        tokenId: Field,
        newVkHash: Field,
        deadline: UInt64
    }) {
        super(value);
    }

    /**
     * Data use to create the signature
     * @returns array of field of all parameters
     */
    toFields(): Field[] {
        return this.contractAddress.toFields().concat(
            this.tokenId.toFields().concat(
                this.newVkHash.toFields().concat(
                    this.deadline.toFields())));
    }

    hash(): Field {
        return Poseidon.hash(this.toFields());
    }
}

export class MultisigInfo extends Struct({
    // merkle root of account who can sign to upgrade
    approvedUpgrader: Field,
    // hash of data passed to the signature
    messageHash: Field,
    // deadline 
    deadline: UInt64
}) {
    constructor(value: {
        approvedUpgrader: Field,
        messageHash: Field,
        deadline: UInt64
    }) {
        super(value);
    }

    /**
   * Data use to create the signature
   * @returns array of field of all parameters
   */
    toFields(): Field[] {
        return this.messageHash.toFields();
    }
}

export class SignatureInfo extends Struct({
    // signer account
    user: PublicKey,
    // witness of this account in the merkle root
    witness: MerkleMapWitness,
    // signature created by this user
    signature: Signature,
    // right
    right: SignatureRight

}) {
    constructor(value: {
        user: PublicKey,
        witness: MerkleMapWitness,
        signature: Signature,
        right: SignatureRight
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
        const value = this.right.hash();
        const [root, key] = this.witness.computeRootAndKey(value);
        root.assertEquals(merkle, "Invalid signer");
        key.assertEquals(hashUser, "Invalid key");
        Provable.log("user", this.user);
        Provable.log("data validate", data);
        return this.signature.verify(this.user, data);
    }
}

export const MultisigProgram = ZkProgram({
    name: 'multisig',
    publicInput: MultisigInfo,
    publicOutput: SignatureRight,

    methods: {
        verifyUpdatePool: {
            privateInputs: [UpgradeInfo, Provable.Array(SignatureInfo, 3)],
            async method(
                info: MultisigInfo,
                upgradeInfo: UpgradeInfo,
                signatures: SignatureInfo[]
            ) {
                info.deadline.equals(upgradeInfo.deadline).assertTrue("Deadline doesn't match")
                // check the signature come from 3 different users
                signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer");
                signatures[1].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                signatures[0].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                for (let index = 0; index < signatures.length; index++) {
                    const element = signatures[index];
                    // check if he can upgrade a pool
                    element.right.uppdatePool.assertTrue("User doesn't have the right to update a pool");
                    // verfify the signature validity for all users
                    const valid = element.validate(info.approvedUpgrader, upgradeInfo.toFields());
                    // hash valid
                    info.messageHash.equals(upgradeInfo.hash()).assertTrue("Message didn't match parameters")
                    valid.assertTrue("Invalid signature");
                }

                return { publicOutput: SignatureRight.canUpdatePool() };
            },
        },
    },
});


export let MultisigProof_ = ZkProgram.Proof(MultisigProgram);
export class MultisigProof extends MultisigProof_ { }