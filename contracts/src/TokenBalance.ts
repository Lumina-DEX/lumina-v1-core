import { Field, SmartContract, Permissions, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, TokenContractV2, AccountUpdate, Provable } from 'o1js';

/**
 * Token created for tests
 */
export class TokenBalance extends TokenContractV2 {

    async deploy(args?: DeployArgs) {
        await super.deploy(args);
        this.account.tokenSymbol.set("TB");
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async mintTo(to: PublicKey, amount: UInt64) {
        this.internal.mint({ address: to, amount });
    }

    @method.returns(UInt64)
    async getBalanceOf(address: PublicKey): Promise<UInt64> {
        const tokenId = this.deriveTokenId();
        const account = AccountUpdate.create(address, tokenId).account
        const balance = account.balance.get()
        account.balance.requireEquals(balance)
        Provable.log("address", address);
        Provable.log("token id", tokenId);
        Provable.log("balance", balance);
        return balance
    }

}
