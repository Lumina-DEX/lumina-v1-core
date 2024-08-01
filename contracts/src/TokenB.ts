import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64 } from 'o1js';

/**
 * Token created for tests
 */
export class TokenB extends TokenContract {

    init() {
        super.init();
        this.account.tokenSymbol.set("TTB");
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async mintTo(to: PublicKey, amount: UInt64) {
        this.internal.mint({ address: to, amount });
    }

}