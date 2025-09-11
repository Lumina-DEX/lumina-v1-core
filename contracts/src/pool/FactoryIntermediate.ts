import { FungibleToken } from "mina-fungible-token"
import {
    AccountUpdate,
    AccountUpdateForest,
    Bool,
    DeployArgs,
    Field,
    MerkleMap,
    MerkleMapWitness,
    method,
    Permissions,
    Poseidon,
    PublicKey,
    Signature,
    SmartContract,
    State,
    state,
    Struct,
    TokenContract,
    TokenId,
    UInt32,
    UInt64,
    VerificationKey
} from "o1js"




/**
 * Event emitted when a new pool is created
 */
export class PoolCreationEvent extends Struct({
    sender: PublicKey,
    signer: PublicKey,
    poolAddress: PublicKey,
    token0Address: PublicKey,
    token1Address: PublicKey
}) {
    constructor(value: {
        sender: PublicKey
        signer: PublicKey
        poolAddress: PublicKey
        token0Address: PublicKey
        token1Address: PublicKey
    }) {
        super(value)
    }
}

/**
 * Event emitted when an address is updated
 */
export class UpdateUserEvent extends Struct({
    newUser: PublicKey
}) {
    constructor(
        newUser: PublicKey
    ) {
        super({ newUser })
    }
}

/**
 * Event emitted when the verification key is updated
 */
export class UpdateVerificationKeyEvent extends Struct({
    hash: Field
}) {
    constructor(
        hash: Field
    ) {
        super({ hash })
    }
}

/**
 * Event emitted when the signer list is updated
 */
export class UpdateSignerEvent extends Struct({
    root: Field
}) {
    constructor(
        root: Field
    ) {
        super({ root })
    }
}

/**
 * Factory who create pools
 */
export class FactoryIntermediary extends TokenContract {
    /**
     * List of signer approved to deploy a new pool
     */
    @state(Field)
    approvedSigner = State<Field>()
    /**
     * Account who collect protocol fees
     */
    @state(PublicKey)
    protocol = State<PublicKey>()
    /**
     * Delegator account for mina pools
     */
    @state(PublicKey)
    delegator = State<PublicKey>()

    /**
     * List of pool factory events
     */
    events = {
        poolAdded: PoolCreationEvent,
        upgrade: UpdateVerificationKeyEvent,
        updateSigner: UpdateSignerEvent,
        updateProtocol: UpdateUserEvent,
        updateDelegator: UpdateUserEvent,
        updateOwner: UpdateUserEvent
    }

    /**
     * Method call when you deploy the pool factory contracts
     * @param args default data stored in the contracts
     */
    async deploy(args: DeployArgs) {
        await super.deploy(args)

    }

    /**
     * Upgrade to a new version
     * @param multisig multisig data
     * @param vk new verification key
     */
    @method
    async updateVerificationKey(vk: VerificationKey) {
        this.account.verificationKey.set(vk)
        this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash))
    }

    /**
     * Update the list of approved signers
     * @param multisig multisig data
     * @param newRoot merkle root of the new list
     */
    @method
    async updateApprovedSigner(newRoot: Field) {
        this.approvedSigner.set(newRoot)
        this.emitEvent("updateSigner", new UpdateSignerEvent(newRoot))
    }

    /**
     * Method use by token allowance but it's not permissible to use it
     * @param forest account forest to update
     */
    @method
    async approveBase(forest: AccountUpdateForest) {
        forest.isEmpty().assertTrue("You can't approve any token operation")
    }

}
