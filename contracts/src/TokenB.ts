import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, TokenContractV2 } from 'o1js';

/**
 * Token created for tests
 */
export class TokenB extends TokenContractV2 {

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
