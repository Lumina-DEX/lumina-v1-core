import { AccountUpdate, AccountUpdateForest, Bool, DeployArgs, Field, MerkleWitness, method, Permissions, Poseidon, PublicKey, Signature, state, State, Struct, TokenContract, TokenId, UInt64, VerificationKey } from 'o1js';
import { FungibleToken } from '../indexpool.js';


export const contractData = "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"
export const contractHash = Field(525354955974972084731560868869788606488189734002260853742481119708716481546n);
export const contractHolderData = "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"
export const contractHolderHash = Field(8375844776264661332033234086773198701280720184261004222373374510285210616412n);

export interface PoolDeployProps extends Exclude<DeployArgs, undefined> {
    symbol: string;
    src: string;
    protocol: PublicKey;
    owner: PublicKey;
    delegator: PublicKey;
    approvedSigner: Field;
}

export class PoolCreationEvent extends Struct({
    sender: PublicKey,
    signer: PublicKey,
    poolAddress: PublicKey,
    token0Address: PublicKey,
    token1Address: PublicKey
}) {
    constructor(value: {
        sender: PublicKey,
        signer: PublicKey,
        poolAddress: PublicKey,
        token0Address: PublicKey,
        token1Address: PublicKey
    }) {
        super(value);
    }
}

export class UpdateUserEvent extends Struct({
    newUser: PublicKey,
}) {
    constructor(
        newUser: PublicKey,
    ) {
        super({ newUser });
    }
}

export class UpdateVerificationKeyEvent extends Struct({
    hash: Field,
}) {
    constructor(
        hash: Field,
    ) {
        super({ hash });
    }
}

export class UpdateSignerEvent extends Struct({
    root: Field,
}) {
    constructor(
        root: Field,
    ) {
        super({ root });
    }
}

// 2^32 signers approved signer possible
export class SignerMerkleWitness extends MerkleWitness(32) { }

/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContract {

    @state(Field) approvedSigner = State<Field>();
    @state(PublicKey) owner = State<PublicKey>();
    @state(PublicKey) protocol = State<PublicKey>();
    @state(PublicKey) delegator = State<PublicKey>();


    events = {
        poolAdded: PoolCreationEvent,
        upgrade: UpdateVerificationKeyEvent,
        updateSigner: UpdateSignerEvent,
        updateProtocol: UpdateUserEvent,
        updateDelegator: UpdateUserEvent,
        updateOwner: UpdateUserEvent
    };

    async deploy(args: PoolDeployProps) {
        await super.deploy(args);
        args.owner.isEmpty().assertFalse("Owner is empty");

        this.account.zkappUri.set(args.src);
        this.account.tokenSymbol.set(args.symbol);
        this.approvedSigner.set(args.approvedSigner);
        this.owner.set(args.owner);
        this.protocol.set(args.protocol);
        this.delegator.set(args.delegator);

        let permissions = Permissions.default();
        permissions.access = Permissions.proofOrSignature();
        permissions.setPermissions = Permissions.impossible();
        permissions.setVerificationKey = Permissions.VerificationKey.proofOrSignature();
        this.account.permissions.set(permissions);
    }

    /**
     * Upgrade to a new version
     * @param vk new verification key
     */
    @method async updateVerificationKey(vk: VerificationKey) {
        await this.getOwnerSignature();
        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash));
    }

    @method async updateApprovedSigner(newSigner: Field) {
        await this.getOwnerSignature();
        this.approvedSigner.set(newSigner);
        this.emitEvent("updateSigner", new UpdateSignerEvent(newSigner));
    }

    @method async setNewOwner(newOwner: PublicKey) {
        await this.getOwnerSignature();
        // require signature for the new owner to prevent incorrect transfer
        AccountUpdate.createSigned(newOwner);
        this.owner.set(newOwner);
        this.emitEvent("updateOwner", new UpdateUserEvent(newOwner));
    }

    @method async setNewProtocol(newProtocol: PublicKey) {
        await this.getOwnerSignature();
        this.protocol.set(newProtocol);
        this.emitEvent("updateProtocol", new UpdateUserEvent(newProtocol));
    }

    @method async setNewDelegator(newDelegator: PublicKey) {
        await this.getOwnerSignature();
        this.delegator.set(newDelegator);
        this.emitEvent("updateDelegator", new UpdateUserEvent(newDelegator));
    }

    @method.returns(PublicKey) async getProtocol() {
        const protocol = this.protocol.getAndRequireEquals();
        return protocol;
    }

    @method.returns(PublicKey) async getOwner() {
        const owner = this.owner.getAndRequireEquals();
        return owner;
    }

    @method.returns(PublicKey) async getDelegator() {
        const delegator = this.delegator.getAndRequireEquals();
        return delegator;
    }

    @method
    async approveBase(forest: AccountUpdateForest) {
        forest.isEmpty().assertTrue("You can't approve any token operation");
    }

    /**
    * Create a new pool
    * @param newAccount address of the new pool
    * @param token for which the pool is created
    * @param signer who sign the argument
    * @param signature who proves you can deploy this pool (only approved signer or token owner can deploy a pool)
    * @param path merkle witness to check if signer is in the approved list
    */
    @method
    async createPool(newAccount: PublicKey, token: PublicKey, signer: PublicKey, signature: Signature, path: SignerMerkleWitness) {
        token.isEmpty().assertFalse("Token is empty");
        await this.createAccounts(newAccount, token, PublicKey.empty(), token, signer, signature, path, false);
    }

    /**
     * Create a new pool token
     * @param newAccount address of the new pool
     * @param token 0 of the pool
     * @param token 1 of the pool
     * @param signer who sign the argument
     * @param signature who proves you can deploy this pool (only approved signer or token owner can deploy a pool)
     * @param path merkle witness to check if signer is in the approved list
     */
    @method
    async createPoolToken(newAccount: PublicKey, token0: PublicKey, token1: PublicKey, signer: PublicKey, signature: Signature, path: SignerMerkleWitness) {
        token0.x.assertLessThan(token1.x, "Token 0 need to be lesser than token 1");
        // create an address with the 2 public key as pool id
        const fields = token0.toFields().concat(token1.toFields());
        const hash = Poseidon.hashToGroup(fields);
        const publicKey = PublicKey.fromGroup(hash);
        publicKey.isEmpty().assertFalse("publicKey is empty");
        await this.createAccounts(newAccount, publicKey, token0, token1, signer, signature, path, true);

        this.network.snarkedLedgerHash.getAndRequireEquals
    }

    private async createAccounts(newAccount: PublicKey, token: PublicKey, token0: PublicKey, token1: PublicKey, signer: PublicKey, signature: Signature, path: SignerMerkleWitness, isTokenPool: boolean) {
        let tokenAccount = AccountUpdate.create(token, this.deriveTokenId());
        // if the balance is not zero, so a pool already exist for this token
        tokenAccount.account.balance.requireEquals(UInt64.zero);

        // verify the signer has right to create the pool
        signer.equals(PublicKey.empty()).assertFalse("Empty signer");
        const signerHash = Poseidon.hash(signer.toFields());
        const approvedSignerRoot = this.approvedSigner.getAndRequireEquals();
        const approvedSigner = path.calculateRoot(signerHash).equals(approvedSignerRoot);
        const signerToken0 = signer.equals(token0);
        const signerToken1 = signer.equals(token1);
        approvedSigner.or(signerToken0).or(signerToken1).assertTrue("Invalid signer");
        signature.verify(signer, newAccount.toFields()).assertTrue("Invalid signature");

        // create a pool as this new address
        const poolAccount = AccountUpdate.createSigned(newAccount);
        // Require this account didn't already exist
        poolAccount.account.isNew.requireEquals(Bool(true));

        // set pool account vk and permission
        poolAccount.body.update.verificationKey = { isSome: Bool(true), value: { data: contractData, hash: contractHash } };
        poolAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                // only proof to prevent signature owner to steal liquidity
                access: Permissions.proof(),
                setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
                send: Permissions.proof(),
                setDelegate: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };

        // set poolAccount initial state
        const appState = this.createState(token0, token1);
        poolAccount.body.update.appState = appState;

        // Liquidity token default name
        poolAccount.account.tokenSymbol.set("LUM");

        // create a token holder as this new address
        if (isTokenPool) {
            // only pool token need an account at token 0 address
            await this.createPoolHolderAccount(newAccount, token0, appState);
        }
        await this.createPoolHolderAccount(newAccount, token1, appState);

        // create a liquidity token holder as this new address
        const tokenId = TokenId.derive(newAccount);
        const liquidityAccount = AccountUpdate.createSigned(newAccount, tokenId);
        // Require this account didn't already exist
        liquidityAccount.account.isNew.requireEquals(Bool(true));
        liquidityAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
                // This is necessary in order to allow burn circulation supply without signature
                send: Permissions.none(),
                setPermissions: Permissions.impossible()
            },
        };


        // we mint one token to check if this pool exist 
        this.internal.mint({ address: tokenAccount, amount: UInt64.one });

        await poolAccount.approve(liquidityAccount);

        const sender = this.sender.getAndRequireSignature();
        this.emitEvent("poolAdded", new PoolCreationEvent({ sender, signer, poolAddress: newAccount, token0Address: token0, token1Address: token1 }));
    }

    private createState(token0: PublicKey, token1: PublicKey): { isSome: Bool; value: Field; }[] {
        let token0Fields = token0.toFields();
        let token1Fields = token1.toFields();
        let poolFactory = this.address.toFields();
        let protocol = this.protocol.getAndRequireEquals();
        let protocolFields = protocol.toFields();

        return [
            { isSome: Bool(true), value: token0Fields[0] },
            { isSome: Bool(true), value: token0Fields[1] },
            { isSome: Bool(true), value: token1Fields[0] },
            { isSome: Bool(true), value: token1Fields[1] },
            { isSome: Bool(true), value: poolFactory[0] },
            { isSome: Bool(true), value: poolFactory[1] },
            { isSome: Bool(true), value: protocolFields[0] },
            { isSome: Bool(true), value: protocolFields[1] },
        ];
    }

    private async createPoolHolderAccount(newAccount: PublicKey, token: PublicKey, appState: { isSome: Bool; value: Field; }[]): Promise<AccountUpdate> {
        const fungibleToken = new FungibleToken(token);
        const poolHolderAccount = AccountUpdate.createSigned(newAccount, fungibleToken.deriveTokenId());
        // Require this account didn't already exist
        poolHolderAccount.account.isNew.requireEquals(Bool(true));

        // set pool token holder account vk and permission
        poolHolderAccount.body.update.verificationKey = { isSome: Bool(true), value: { data: contractHolderData, hash: contractHolderHash } };
        poolHolderAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
                send: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };
        poolHolderAccount.body.update.appState = appState;
        await fungibleToken.approveAccountUpdate(poolHolderAccount);
        return poolHolderAccount;
    }

    private async getOwnerSignature() {
        const owner = this.owner.getAndRequireEquals();
        // only owner can update a pool
        AccountUpdate.createSigned(owner);
    }
}