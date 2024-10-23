import { Field, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct, CircuitString, assert, Types } from 'o1js';
import { BalanceChangeEvent, PoolMina, mulDiv, PoolData, PoolHolder } from './indexmina.js';
import { FarmStorage } from './FarmStorage.js';

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
    pool: PublicKey;
    owner: PublicKey;
}


/**
 * Farm contract
 */
export class Farm extends TokenContractV2 {
    // Farming for one pool
    @state(PublicKey) pool = State<PublicKey>();
    @state(PublicKey) owner = State<PublicKey>();


    events = {
        upgrade: Field,
        BalanceChange: BalanceChangeEvent,
    };

    async deploy(args: FarmingDeployProps) {
        await super.deploy();

        args.pool.isEmpty().assertFalse("Pool empty");
        args.owner.isEmpty().assertFalse("Owner empty");

        this.pool.set(args.pool);
        this.owner.set(args.owner);

        let permissions = Permissions.default();
        permissions.access = Permissions.proofOrSignature();
        permissions.setPermissions = Permissions.impossible();
        permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion();
        this.account.permissions.set(permissions);
    }

    /**
    * Upgrade to a new version
    * @param vk new verification key
    */
    @method async updateVerificationKey(vk: VerificationKey) {
        const owner = await this.owner.getAndRequireEquals();

        // only owner can update a pool
        AccountUpdate.createSigned(owner);

        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }

    /** Approve `AccountUpdate`s that have been created outside of the token contract.
      *
      * @argument {AccountUpdateForest} updates - The `AccountUpdate`s to approve. Note that the forest size is limited by the base token contract, @see TokenContractV2.MAX_ACCOUNT_UPDATES The current limit is 9.
      */
    @method
    async approveBase(updates: AccountUpdateForest): Promise<void> {
        let totalBalance = Int64.from(0)
        this.forEachUpdate(updates, (update, usesToken) => {
            // Make sure that the account permissions are not changed
            this.checkPermissionsUpdate(update)
            this.emitEventIf(
                usesToken,
                "BalanceChange",
                new BalanceChangeEvent({ address: update.publicKey, amount: update.balanceChange }),
            )

            // Don't allow transfers to/from the account that's tracking circulation
            update.publicKey.equals(this.address).and(usesToken).assertFalse(
                "Can't transfer to/from the circulation account"
            )
            totalBalance = Provable.if(usesToken, totalBalance.add(update.balanceChange), totalBalance)
            totalBalance.isPositiveV2().assertFalse(
                "Flash-minting or unbalanced transaction detected"
            )
        })
        totalBalance.assertEquals(Int64.zero, "Unbalanced transaction")
    }

    private checkPermissionsUpdate(update: AccountUpdate) {
        let permissions = update.update.permissions

        let { access, receive } = permissions.value
        let accessIsNone = Provable.equal(Types.AuthRequired, access, Permissions.none())
        let receiveIsNone = Provable.equal(Types.AuthRequired, receive, Permissions.none())
        let updateAllowed = accessIsNone.and(receiveIsNone)

        assert(
            updateAllowed.or(permissions.isSome.not()),
            "Can't change permissions for access or receive on token accounts"
        )
    }

    @method
    async transfer(from: PublicKey, to: PublicKey, amount: UInt64) {
        from.equals(this.address).assertFalse("Can't transfer to/from the circulation account");
        to.equals(this.address).assertFalse("Can't transfer to/from the circulation account");
        this.internal.send({ from, to, amount })
    }

    @method
    async deposit(amount: UInt64) {
        const poolAddress = this.pool.getAndRequireEquals();
        const sender = this.sender.getUnconstrainedV2();

        const farmStorage = new FarmStorage(sender, this.deriveTokenId());
        farmStorage.deposit(poolAddress, amount);

    }


}
