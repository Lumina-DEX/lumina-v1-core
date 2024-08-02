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
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }
}
