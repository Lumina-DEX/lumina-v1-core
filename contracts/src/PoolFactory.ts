import { Field, SmartContract, state, Permissions, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Poseidon, VerificationKey, Reducer, Account, assert, fetchAccount, MerkleList, TransactionVersion, TokenContractV2, DeployArgs, TokenId, CircuitString } from 'o1js';
import { FungibleToken, PoolData, PoolMina, PoolTokenHolder } from './indexmina.js';


export const contractData = "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"
export const contractHash = Field("8642771525181444673427468792027489317375190587893776849322176608397810296995");
export const contractHolderData = "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"
export const contractHolderHash = Field("13438999190718665361261930649641122491361462967612445041104774977203208003194");

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