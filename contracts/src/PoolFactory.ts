import { Field, SmartContract, state, Permissions, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Poseidon, VerificationKey, Reducer, Account, assert, fetchAccount, MerkleList, TransactionVersion, TokenContractV2, DeployArgs, TokenId, CircuitString } from 'o1js';
import { FungibleToken, PoolData, PoolMina, PoolTokenHolder } from './indexmina.js';


export const contractData = "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";
export const contractHash = Field(18748543053727220221430753130201141078637967644250566268749196341295957040491n);
export const contractHolderData = "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";
export const contractHolderHash = Field(18980734166018933396140104957846621050278537425749465395169310301565220084795n);

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    symbol: string;
    src: string;
    poolData: PublicKey;
}

export class PoolCreationEvent extends Struct({
    sender: PublicKey,
    poolAddress: PublicKey,
    tokenAddress: PublicKey
}) {
    constructor(value: {
        sender: PublicKey,
        poolAddress: PublicKey,
        tokenAddress: PublicKey
    }) {
        super(value);
    }
}


/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContractV2 {

    @state(PublicKey) poolData = State<PublicKey>();

    events = {
        poolAdded: PoolCreationEvent,
        upgrade: Field
    };

    async deploy(args: PoolMinaDeployProps) {
        await super.deploy(args);
        args.poolData.isEmpty().assertFalse("Pool data empty");

        this.account.zkappUri.set(args.src);
        this.account.tokenSymbol.set(args.symbol);
        this.poolData.set(args.poolData);

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
        const poolDataAddress = this.poolData.getAndRequireEquals();
        const poolData = new PoolData(poolDataAddress);
        const owner = poolData.owner.getAndRequireEquals();

        // only owner can update a pool
        AccountUpdate.createSigned(owner);

        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }

    @method
    async approveBase(forest: AccountUpdateForest) {
        forest.isEmpty().assertTrue("You can't approve any token operation");
    }

    /**
     * Create a new pool
     * @param newAccount address of the new pool
     * @param token for which the pool is created
     */
    @method
    async createPool(newAccount: PublicKey, token: PublicKey) {
        token.isEmpty().assertFalse("Token is empty");

        const fungibleToken = new FungibleToken(token);

        let tokenAccount = AccountUpdate.create(token, this.deriveTokenId());
        // if the balance is not zero, so a pool already exist for this token
        tokenAccount.account.balance.requireEquals(UInt64.zero);

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
                setPermissions: Permissions.impossible()
            },
        };

        // set poolAccount initial state
        let tokenFields = token.toFields();
        let poolDataAddress = this.poolData.getAndRequireEquals();
        let poolDataFields = poolDataAddress.toFields();

        poolAccount.body.update.appState = [
            { isSome: Bool(true), value: tokenFields[0] },
            { isSome: Bool(true), value: tokenFields[1] },
            { isSome: Bool(true), value: poolDataFields[0] },
            { isSome: Bool(true), value: poolDataFields[1] },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
        ];


        // Liquidity token default name
        poolAccount.account.tokenSymbol.set("LUM");

        // create a token holder as this new address
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

        await fungibleToken.approveAccountUpdate(poolHolderAccount);
        await poolAccount.approve(liquidityAccount);

        const sender = this.sender.getUnconstrainedV2();
        this.emitEvent("poolAdded", new PoolCreationEvent({ sender, poolAddress: newAccount, tokenAddress: token }));

    }

}