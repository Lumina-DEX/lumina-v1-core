import { Field, SmartContract, state, Permissions, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, TokenContractV2, AccountUpdate } from 'o1js';

/**
 * A minimal fungible token
 */
export class TokenStandard extends TokenContractV2 {

    init() {
        super.init();

        const sender = this.sender.getUnconstrained();

        // mint to deployer
        this.internal.mint({
            address: sender,
            amount: UInt64.MAXINT(),
        });
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }
}
