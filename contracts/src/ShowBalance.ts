import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable } from 'o1js';
import { TokenStandard } from './index.js';


/**
 * Pool contract for Lumina dex
 */
export class ShowBalance extends SmartContract {
    init() {
        super.init();
    }

    @method.returns(UInt64) async getBalance(account: PublicKey, token: PublicKey) {

        let tokenContract = new TokenStandard(token);

        const holder = new TokenStandard(account, tokenContract.deriveTokenId());

        const balance = holder.account.balance.getAndRequireEquals();

        return balance;
    }

}
