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
    @state(UInt64) amount = State<UInt64>();
    @state(UInt64) lastDeposit = State<UInt64>();
    @state(UInt64) actualReward = State<UInt64>();

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
    async deposit(poolAddress: PublicKey, amount: UInt64) {
        const pool = new PoolMina(poolAddress);

        const sender = this.sender.getUnconstrainedV2();
        // transfer amount to this account
        await pool.transfer(sender, this.address, amount);

        // maybe is to this method to call deposit ?
    }


}
