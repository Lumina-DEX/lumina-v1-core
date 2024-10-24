import { Field, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct, CircuitString, assert, Types, SmartContract } from 'o1js';
import { BalanceChangeEvent, PoolMina, mulDiv, PoolData, PoolHolder } from './indexmina.js';
import { FarmStorage } from './FarmStorage.js';

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
    pool: PublicKey;
    owner: PublicKey;
}


/**
 * Farm contract
 */
export class FarmPoolHolder extends SmartContract {
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

    @method
    async withdraw(amount: UInt64) {
        const sender = this.sender.getAndRequireSignatureV2();
        const newStorage = new FarmStorage(sender, this.deriveTokenId());
        newStorage.deposit(amount);
    }

    @method
    async withdrawReward() {
        const sender = this.sender.getAndRequireSignatureV2();
        const newStorage = new FarmStorage(sender, this.deriveTokenId());
        const points = newStorage.withdrawReward();
    }
}
