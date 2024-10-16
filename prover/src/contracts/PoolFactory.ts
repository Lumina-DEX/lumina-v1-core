import { Field, SmartContract, state, Permissions, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Poseidon, VerificationKey, Reducer, Account, assert, fetchAccount, MerkleList, TransactionVersion, TokenContractV2, DeployArgs, TokenId, CircuitString } from 'o1js';
import { FungibleToken, PoolMina, PoolTokenHolder } from './indexmina.js';


const contractData = "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";
const contractHash = Field("6022389358534772890668465393330190115210352413664341627702449400961108940743");
const contractHolderData = "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";
const contractHolderHash = Field("14876228843422336231707155776674524464588865100857502212615881432279939190870");

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    symbol: string;
    src: string;
    protocol: PublicKey;
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

    @state(PublicKey) protocol = State<PublicKey>();

    events = {
        poolAdded: PoolCreationEvent
    };

    async deploy(args: PoolMinaDeployProps) {
        await super.deploy(args);
        args.protocol.isEmpty().assertFalse("Protocol empty");

        this.account.zkappUri.set(args.src);
        this.account.tokenSymbol.set(args.symbol);
        this.protocol.set(args.protocol);

        let permissions = Permissions.default();
        permissions.access = Permissions.proofOrSignature();
        permissions.setPermissions = Permissions.impossible();
        permissions.setVerificationKey = Permissions.VerificationKey.impossibleDuringCurrentVersion();
        this.account.permissions.set(permissions);
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
                setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
                send: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };

        // set poolAccount initial state
        let tokenFields = token.toFields();
        let protocolFields = this.protocol.getAndRequireEquals().toFields();

        poolAccount.body.update.appState = [
            { isSome: Bool(true), value: tokenFields[0] },
            { isSome: Bool(true), value: tokenFields[1] },
            { isSome: Bool(true), value: protocolFields[0] },
            { isSome: Bool(true), value: protocolFields[1] },
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
                setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
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