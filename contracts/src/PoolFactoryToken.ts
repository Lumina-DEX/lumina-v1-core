import { Field, SmartContract, state, Permissions, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Poseidon, VerificationKey, Reducer, Account, assert, fetchAccount, MerkleList, TransactionVersion, TokenContractV2, DeployArgs, TokenId, CircuitString } from 'o1js';
import { FungibleToken, PoolData, PoolMina, PoolTokenHolder } from './indexmina.js';

export const contractData = "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";
export const contractHash = Field(15068896408022487379880322703371374474666356588017996461303196660579110713806n);
export const contractHolderData = "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";
export const contractHolderHash = Field(25443899230247521099182662679610012571023018964875232099199570564816610886084n);

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

        const fungibleToken0 = new FungibleToken(token0);
        const fungibleToken1 = new FungibleToken(token1);
        await fungibleToken0.approveAccountUpdate(poolHolderAccount0);
        await fungibleToken1.approveAccountUpdate(poolHolderAccount1);
        await poolAccount.approve(liquidityAccount);

        const sender = this.sender.getUnconstrainedV2();
        this.emitEvent("poolAdded", new PoolCreationEvent({ sender, poolAddress: newAccount, tokenAddress: token0 }));

    }

}