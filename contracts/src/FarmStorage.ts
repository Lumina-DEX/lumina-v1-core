import { Field, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct, CircuitString, assert, Types, SmartContract } from 'o1js';
import { BalanceChangeEvent, PoolMina, mulDiv, PoolData, PoolHolder } from './indexmina.js';

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
    pool: PublicKey;
    owner: PublicKey;
}


/**
 * Farm contract
 */
export class FarmStorage extends SmartContract {
    // Farming for one pool
    @state(PublicKey) pool = State<PublicKey>();
    // current amount deposited
    @state(UInt64) amount = State<UInt64>();
    // last time deposited
    @state(UInt64) lastDeposit = State<UInt64>();
    // points win before last deposit (1 point by token by minute)
    @state(UInt64) points = State<UInt64>();

    events = {
        upgrade: Field,
    };

    async deploy() {
        await super.deploy();
    }

    @method.returns(UInt64)
    async getAmount() {
        const currentAmount = this.amount.getAndRequireEquals();
        return currentAmount;
    }

    @method
    async deposit(amount: UInt64) {
        const poolAddress = this.pool.getAndRequireEquals();
        const pool = new PoolMina(poolAddress);

        const sender = this.sender.getUnconstrainedV2();
        this.address.assertEquals(sender);
        // transfer amount to this account
        await pool.transfer(sender, this.address, amount);

        const currentAmount = this.amount.getAndRequireEquals();
        const newAmount = currentAmount.add(amount);
        this.amount.set(newAmount);

        // maybe is to this method to call deposit ?
        const timestamp = this.network.timestamp.getAndRequireEquals();
        const lastDeposit = this.lastDeposit.getAndRequireEquals();
        const winPoints = this.calculatePoint(currentAmount, lastDeposit, timestamp);
    }


    @method
    async withdraw(amount: UInt64) {
        const poolAddress = this.pool.getAndRequireEquals();
        const pool = new PoolMina(poolAddress);

        const currentAmount = this.amount.getAndRequireEquals();
        amount.assertLessThanOrEqual(currentAmount, "Insuffisient amount");

        const sender = this.sender.getUnconstrainedV2();
        this.address.assertEquals(sender);
        // transfer amount to this account
        await pool.transfer(this.address, sender, amount);

        const newAmount = currentAmount.sub(amount);
        this.amount.set(newAmount);

        // maybe is to this method to call deposit ?
        const timestamp = this.network.timestamp.getAndRequireEquals();
        const lastDeposit = this.lastDeposit.getAndRequireEquals();
        const winPoints = this.calculatePoint(currentAmount, lastDeposit, timestamp);
    }

    @method
    async withdrawReward(amount: UInt64) {
        const poolAddress = this.pool.getAndRequireEquals();
        const pool = new PoolMina(poolAddress);

        const currentAmount = this.amount.getAndRequireEquals();
        amount.assertLessThanOrEqual(currentAmount, "Insuffisient amount");

        const sender = this.sender.getUnconstrainedV2();
        // transfer amount to this account
        await pool.transfer(this.address, sender, amount);

        const newAmount = currentAmount.sub(amount);
        this.amount.set(newAmount);

        // maybe is to this method to call deposit ?
        const timestamp = this.network.timestamp.getAndRequireEquals();
        const lastDeposit = this.lastDeposit.getAndRequireEquals();
        const winPoints = this.calculatePoint(currentAmount, lastDeposit, timestamp);

    }

    private async calculatePoint(currentAmount: UInt64, lastDeposit: UInt64, timestamp: UInt64) {
        lastDeposit.assertLessThan(timestamp, "last deposit is not older than current block");

        const time = timestamp.sub(lastDeposit);
        // calculate points by minutes
        const points = mulDiv(time, currentAmount, UInt64.from(60));
        return points;
    }

}
