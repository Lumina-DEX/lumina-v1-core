import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64 } from 'o1js';

/**
 * A minimal fungible token
 */
export class TokenStandard extends TokenContract {

    init() {
        super.init();
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }
}
