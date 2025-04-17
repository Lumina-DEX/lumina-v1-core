import { Bool, Field, MerkleMapWitness, Poseidon, Provable, PublicKey, Signature, Struct, UInt64, ZkProgram } from 'o1js';


export class SignatureRight extends Struct({
    deployPool: Bool,
    uppdatePool: Bool,
    updateSigner: Bool,
    updateProtocol: Bool,
    updateDelegator: Bool,
    updateFactory: Bool
}) {
    constructor(deployPool: Bool,
        uppdatePool: Bool,
        updateSigner: Bool,
        updateProtocol: Bool,
        updateDelegator: Bool,
        updateFactory: Bool) {
        super({
            deployPool,
            uppdatePool,
            updateSigner,
            updateProtocol,
            updateDelegator,
            updateFactory
        });
    }

    toFields(): Field[] {
        return this.deployPool.toFields().concat(
            this.uppdatePool.toFields().concat(
                this.updateSigner.toFields().concat(
                    this.updateProtocol.toFields().concat(
                        this.updateDelegator.toFields().concat(
                            this.updateFactory.toFields()
                        )))));
    }

    static canUpdatePool(): SignatureRight {
        return new SignatureRight(Bool(false), Bool(true), Bool(false), Bool(false), Bool(false), Bool(false))
    }

    static canUpdateDelegator(): SignatureRight {
        return new SignatureRight(Bool(false), Bool(false), Bool(false), Bool(false), Bool(true), Bool(false))
    }

    static canUpdateProtocol(): SignatureRight {
        return new SignatureRight(Bool(false), Bool(false), Bool(false), Bool(true), Bool(false), Bool(false))
    }

    static canUpdateSigner(): SignatureRight {
        return new SignatureRight(Bool(false), Bool(false), Bool(true), Bool(false), Bool(false), Bool(false))
    }

    static canUpdateFactory(): SignatureRight {
        return new SignatureRight(Bool(false), Bool(false), Bool(false), Bool(false), Bool(false), Bool(true))
    }

    // hash store in the signer merkle map
    hash(): Field {
        return Poseidon.hash(this.toFields());
    }
}


export class UpdateFactoryInfo extends Struct({
    // new verification key hash to submit
    newVkHash: Field,
    // deadline to use this signature
    deadline: UInt64
}) {
    constructor(value: {
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
        return this.newVkHash.toFields().concat(
            this.deadline.toFields());
    }

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

export class UpdateAccountInfo extends Struct({
    // old account address
    oldUser: PublicKey,
    // new account address
    newUser: PublicKey,
    // deadline to use this signature
    deadline: UInt64
}) {
    constructor(value: {
        oldUser: PublicKey,
        newUser: PublicKey,
        deadline: UInt64
    }) {
        super(value);
    }

    /**
     * Data use to create the signature
     * @returns array of field of all parameters
     */
    toFields(): Field[] {
        return this.oldUser.toFields().concat(
            this.newUser.toFields().concat(
                this.deadline.toFields()));
    }

    hash(): Field {
        return Poseidon.hash(this.toFields());
    }
}

export class UpdateSignerData extends Struct({
    // old signer root
    oldRoot: Field,
    // new signer root
    newRoot: Field,
    // deadline to use this signature
    deadline: UInt64
}) {
    constructor(value: {
        oldRoot: Field,
        newRoot: Field,
        deadline: UInt64
    }) {
        super(value);
    }

    /**
     * Data use to create the signature
     * @returns array of field of all parameters
     */
    toFields(): Field[] {
        return this.oldRoot.toFields().concat(
            this.newRoot.toFields().concat(
                this.deadline.toFields()));
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
        verifyUpdateSigner: {
            privateInputs: [UpdateSignerData, Provable.Array(SignatureInfo, 3), Provable.Array(SignatureInfo, 3)],
            async method(
                info: MultisigInfo,
                upgradeInfo: UpdateSignerData,
                signatures: SignatureInfo[],
                // the signer in the new merkle root need to sign to prevent to lock proof update
                newSignatures: SignatureInfo[]
            ) {
                info.deadline.equals(upgradeInfo.deadline).assertTrue("Deadline doesn't match")
                // check the signature come from 3 different users
                signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer");
                signatures[1].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                signatures[0].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                newSignatures[0].user.equals(newSignatures[1].user).assertFalse("Can't include new same signer");
                newSignatures[1].user.equals(newSignatures[2].user).assertFalse("Can't include new same signer");
                newSignatures[0].user.equals(newSignatures[2].user).assertFalse("Can't include new same signer");

                for (let index = 0; index < signatures.length; index++) {
                    const element = signatures[index];
                    const newElement = newSignatures[index];
                    // check if he can update signer
                    element.right.updateSigner.assertTrue("User doesn't have the right to update the signer root");
                    newElement.right.updateSigner.assertTrue("New user doesn't have the right to update the signer root");
                    // verfify the signature validity for all users
                    info.approvedUpgrader.equals(upgradeInfo.oldRoot).assertTrue("Merkle root doesn't match")
                    const valid = element.validate(info.approvedUpgrader, upgradeInfo.toFields());
                    const newValid = element.validate(upgradeInfo.newRoot, upgradeInfo.toFields());
                    // hash valid
                    info.messageHash.equals(upgradeInfo.hash()).assertTrue("Message didn't match parameters")
                    valid.assertTrue("Invalid signature");
                    newValid.assertTrue("Invalid new signature");
                }

                return { publicOutput: SignatureRight.canUpdateSigner() };
            },
        },
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
        verifyUpdateDelegator: {
            privateInputs: [UpdateAccountInfo, Provable.Array(SignatureInfo, 3)],
            async method(
                info: MultisigInfo,
                updateInfo: UpdateAccountInfo,
                signatures: SignatureInfo[]
            ) {
                info.deadline.equals(updateInfo.deadline).assertTrue("Deadline doesn't match")
                // check the signature come from 3 different users
                signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer");
                signatures[1].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                signatures[0].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                for (let index = 0; index < signatures.length; index++) {
                    const element = signatures[index];
                    // check if he can upgrade a pool
                    element.right.updateDelegator.assertTrue("User doesn't have the right to update the delegator");
                    // verfify the signature validity for all users
                    const valid = element.validate(info.approvedUpgrader, updateInfo.toFields());
                    // hash valid
                    info.messageHash.equals(updateInfo.hash()).assertTrue("Message didn't match parameters")
                    valid.assertTrue("Invalid signature");
                }

                return { publicOutput: SignatureRight.canUpdateDelegator() };
            },
        },
        verifyUpdateProtocol: {
            privateInputs: [UpdateAccountInfo, Provable.Array(SignatureInfo, 3)],
            async method(
                info: MultisigInfo,
                updateInfo: UpdateAccountInfo,
                signatures: SignatureInfo[]
            ) {
                info.deadline.equals(updateInfo.deadline).assertTrue("Deadline doesn't match")
                // check the signature come from 3 different users
                signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer");
                signatures[1].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                signatures[0].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                for (let index = 0; index < signatures.length; index++) {
                    const element = signatures[index];
                    // check if he can upgrade a pool
                    element.right.updateProtocol.assertTrue("User doesn't have the right to update the protcol");
                    // verfify the signature validity for all users
                    const valid = element.validate(info.approvedUpgrader, updateInfo.toFields());
                    // hash valid
                    info.messageHash.equals(updateInfo.hash()).assertTrue("Message didn't match parameters")
                    valid.assertTrue("Invalid signature");
                }

                return { publicOutput: SignatureRight.canUpdateProtocol() };
            },
        },
        verifyUpdateFactory: {
            privateInputs: [UpdateFactoryInfo, Provable.Array(SignatureInfo, 3)],
            async method(
                info: MultisigInfo,
                updateInfo: UpdateFactoryInfo,
                signatures: SignatureInfo[]
            ) {
                info.deadline.equals(updateInfo.deadline).assertTrue("Deadline doesn't match")
                // check the signature come from 3 different users
                signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer");
                signatures[1].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                signatures[0].user.equals(signatures[2].user).assertFalse("Can't include same signer");
                for (let index = 0; index < signatures.length; index++) {
                    const element = signatures[index];
                    // check if he can upgrade a pool
                    element.right.updateFactory.assertTrue("User doesn't have the right to update the factory");
                    // verfify the signature validity for all users
                    const valid = element.validate(info.approvedUpgrader, updateInfo.toFields());
                    // hash valid
                    info.messageHash.equals(updateInfo.hash()).assertTrue("Message didn't match parameters")
                    valid.assertTrue("Invalid signature");
                }

                return { publicOutput: SignatureRight.canUpdateFactory() };
            },
        },
    },
});


export let MultisigProof_ = ZkProgram.Proof(MultisigProgram);
export class MultisigProof extends MultisigProof_ { }