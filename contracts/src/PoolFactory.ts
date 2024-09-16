import { Field, SmartContract, state, Permissions, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Poseidon, VerificationKey, Reducer, Account, assert, fetchAccount, MerkleList, TransactionVersion, TokenContractV2, DeployArgs } from 'o1js';
import { FungibleToken, PoolMinaV2, MinaTokenHolderV2 } from './indexmina.js';


const contract = await PoolMinaV2.compile();
const contractHolder = await MinaTokenHolderV2.compile();

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    symbol: string;
    src: string;
    protocol: PublicKey;
}



/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContractV2 {

    @state(PublicKey) protocol = State<PublicKey>();

    async deploy(args: PoolMinaDeployProps) {
        await super.deploy(args);
        args.protocol.isEmpty().assertFalse("Protocol empty");

        this.account.zkappUri.set(args.src);
        this.account.tokenSymbol.set(args.symbol);
        this.protocol.set(args.protocol);
    }

    init() {
        super.init();

        let permissions = Permissions.default();
        // token not transferable to prevent manipulation for pool creation
        permissions.send = Permissions.impossible();
        permissions.setPermissions = Permissions.impossible();
        permissions.setVerificationKey = Permissions.VerificationKey.impossibleDuringCurrentVersion();
        this.account.permissions.set(permissions);
    }

    @method
    async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    /**
     * Create a new pool
     * @param newAccount address of the new pool
     * @param token for which the pool is created
     * @returns address of the new pool
     */
    @method.returns(PublicKey)
    async createPool(newAccount: PublicKey, token: PublicKey) {
        token.isEmpty().assertFalse("Token is empty");

        const fungibleToken = new FungibleToken(token);

        let tokenAccount = AccountUpdate.create(this.address, fungibleToken.deriveTokenId());
        // if the balance is not zero, so a pool already exist for this token
        tokenAccount.account.balance.requireEquals(UInt64.zero);

        // create a pool as this new address
        const poolAccount = AccountUpdate.createSigned(newAccount);
        // Require this account didn't already exist
        poolAccount.account.isNew.requireEquals(Bool(true));

        // create a token holder as this new address
        const poolHolderAccount = AccountUpdate.createSigned(newAccount, fungibleToken.deriveTokenId());
        // Require this account didn't already exist
        poolHolderAccount.account.isNew.requireEquals(Bool(true));


        // set pool account vk and permission
        poolAccount.body.update.verificationKey = { isSome: Bool(true), value: contract.verificationKey };
        poolAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: {
                    auth: Permissions.impossible(),
                    txnVersion: TransactionVersion.current()
                },
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

        // set pool token holder account vk and permission
        poolHolderAccount.body.update.verificationKey = { isSome: Bool(true), value: contractHolder.verificationKey };
        poolHolderAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: {
                    auth: Permissions.impossible(),
                    txnVersion: TransactionVersion.current()
                },
                send: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };

        // we mint one token to check if this pool exist 
        this.internal.mint({ address: token, amount: UInt64.one });

        return poolAccount.publicKey;
    }

}