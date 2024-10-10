import { Field, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct, CircuitString, assert, Types } from 'o1js';
import { BalanceChangeEvent, FungibleToken, mulDiv, PoolData, PoolMina, PoolTokenHolder } from './indexmina.js';

/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolUpgradeTest extends PoolMina {

    @method.returns(UInt64)
    async version() {
        return UInt64.from(2);
    }
}
