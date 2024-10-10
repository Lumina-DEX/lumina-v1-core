import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey, Poseidon } from 'o1js';
import { PoolData } from './indexmina';



/**
 * Pool informations, use to manage protocol, receiver and verification key update
 */
export class PoolSampleTest extends PoolData {


    @method.returns(UInt64)
    async version() {
        return UInt64.from(2);
    }
}
