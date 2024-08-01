import { Field, SmartContract, Permissions, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64 } from 'o1js';

/**
 * Token created for tests
 */
export class TokenA extends TokenContract {

    async deploy(args?: DeployArgs) {
        await super.deploy(args);
        this.account.tokenSymbol.set("TTA");

        // make account non-upgradable forever
        this.account.permissions.set({
            ...Permissions.default(),
            setVerificationKey:
                Permissions.VerificationKey.impossibleDuringCurrentVersion(),
            setPermissions: Permissions.impossible(),
            access: Permissions.proofOrSignature(),
        });
    }

    @method async init() {
        super.init();
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async mintTo(to: PublicKey, amount: UInt64) {
        this.internal.mint({ address: to, amount });
    }

}
