import { Field, SmartContract, state, Permissions, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, TokenContractV2 } from 'o1js';

/**
 * A minimal fungible token
 */
export class TokenStandard extends TokenContractV2 {

    init() {
        super.init();

        this.account.permissions.set({
            ...Permissions.default(),
            setVerificationKey:
                Permissions.VerificationKey.impossibleDuringCurrentVersion(),
            setPermissions: Permissions.impossible(),
            access: Permissions.proofOrSignature(),
        });

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
