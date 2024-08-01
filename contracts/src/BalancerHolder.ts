import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate } from 'o1js';
import { Balancer, TokenStandard } from './index.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class BalancerHolder extends SmartContract {
    init() {
        super.init();
    }


    @method
    async withdrawBalance(
        balancerAddress: PublicKey,
        amount: UInt64
    ) {
        let pm = new Balancer(balancerAddress);
        const addressA = Balancer.tokenA;
        const tokenA = new TokenStandard(addressA);

        const holderA = new BalancerHolder(balancerAddress, tokenA.deriveTokenId());

        const balanceA = holderA.account.balance.getAndRequireEquals();

        balanceA.assertGreaterThanOrEqual(amount, "Insufficient amount in reserve");

        this.balance.subInPlace(amount);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;
    }

    @method
    async withdrawReserve(
        balancerAddress: PublicKey,
        amount: UInt64
    ) {
        let pm = new Balancer(balancerAddress);
        const balanceA = pm.reserveA.getAndRequireEquals();

        balanceA.assertGreaterThanOrEqual(amount, "Insufficient amount in reserve");

        this.balance.subInPlace(amount);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;
    }
}
