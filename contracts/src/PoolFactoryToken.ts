import { Field, SmartContract, state, Permissions, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Poseidon, VerificationKey, Reducer, Account, assert, fetchAccount, MerkleList, TransactionVersion, TokenContractV2, DeployArgs, TokenId, CircuitString } from 'o1js';
import { FungibleToken, PoolData, PoolMina, PoolTokenHolder } from './indexmina.js';


export const contractData = "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";
export const contractHash = Field(14333849842386632176117514046810868687586107287634725718837527857009306200041n);
export const contractHolderData = "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";
export const contractHolderHash = Field(6775806926672393704133094550029380788265869103218306982461735602609623225648n);

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
export class PoolFactoryToken extends TokenContractV2 {

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
    async createPool(newAccount: PublicKey, token0: PublicKey, token1: PublicKey) {
        token0.x.assertLessThan(token1.x, "Token 0 need to be lesser than token 1");
        const fields = token0.toFields().concat(token1.toFields());
        const publicKey = PublicKey.fromFields(fields);

        publicKey.isEmpty().assertFalse("publicKey is empty");

        let tokenAccount = AccountUpdate.create(publicKey, this.deriveTokenId());
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
        let token0Fields = token0.toFields();
        let token1Fields = token1.toFields();
        let poolDataAddress = this.poolData.getAndRequireEquals();
        let poolDataFields = poolDataAddress.toFields();

        poolAccount.body.update.appState = [
            { isSome: Bool(true), value: token0Fields[0] },
            { isSome: Bool(true), value: token0Fields[1] },
            { isSome: Bool(true), value: token1Fields[0] },
            { isSome: Bool(true), value: token1Fields[1] },
            { isSome: Bool(true), value: poolDataFields[0] },
            { isSome: Bool(true), value: poolDataFields[1] },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
        ];


        // Liquidity token default name
        poolAccount.account.tokenSymbol.set("LUM");

        // create a token holder as this new address
        const tokenId0 = TokenId.derive(token0);
        const tokenId1 = TokenId.derive(token1);
        const poolHolderAccount0 = AccountUpdate.createSigned(newAccount, tokenId0);
        // Require this account didn't already exist
        poolHolderAccount0.account.isNew.requireEquals(Bool(true));

        // set pool token holder account vk and permission
        poolHolderAccount0.body.update.verificationKey = { isSome: Bool(true), value: { data: contractHolderData, hash: contractHolderHash } };
        poolHolderAccount0.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
                send: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };

        poolHolderAccount0.body.update.appState = [
            { isSome: Bool(true), value: token0Fields[0] },
            { isSome: Bool(true), value: token0Fields[1] },
            { isSome: Bool(true), value: token1Fields[0] },
            { isSome: Bool(true), value: token1Fields[1] },
            { isSome: Bool(true), value: poolDataFields[0] },
            { isSome: Bool(true), value: poolDataFields[1] },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
        ];

        const poolHolderAccount1 = AccountUpdate.createSigned(newAccount, tokenId1);
        // Require this account didn't already exist
        poolHolderAccount1.account.isNew.requireEquals(Bool(true));

        // set pool token holder account vk and permission
        poolHolderAccount1.body.update.verificationKey = { isSome: Bool(true), value: { data: contractHolderData, hash: contractHolderHash } };
        poolHolderAccount1.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
                send: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };

        poolHolderAccount1.body.update.appState = [
            { isSome: Bool(true), value: token0Fields[0] },
            { isSome: Bool(true), value: token0Fields[1] },
            { isSome: Bool(true), value: token1Fields[0] },
            { isSome: Bool(true), value: token1Fields[1] },
            { isSome: Bool(true), value: poolDataFields[0] },
            { isSome: Bool(true), value: poolDataFields[1] },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
        ];


        // we mint one token to check if this pool exist 
        this.internal.mint({ address: tokenAccount, amount: UInt64.one });

        const fungibleToken0 = new FungibleToken(token0);
        const fungibleToken1 = new FungibleToken(token1);
        await fungibleToken0.approveAccountUpdate(poolHolderAccount0);
        await fungibleToken1.approveAccountUpdate(poolHolderAccount1);

        const sender = this.sender.getUnconstrainedV2();
        this.emitEvent("poolAdded", new PoolCreationEvent({ sender, poolAddress: newAccount, tokenAddress: token0 }));

    }

}