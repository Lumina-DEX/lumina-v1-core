import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable } from 'o1js';
import { TokenStandard, TokenHolder, mulDiv, BalancerHolder } from './index.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

/**
 * Pool contract for Lumina dex
 */
export class Balancer extends SmartContract {
    // we need the token address to instantiate it
    public static tokenA: PublicKey = PublicKey.fromBase58("B62qjZ1W2ybx2AYLYUyjPMoBT6Kn6CPPjAN2WWSRKH46uGgn2SgeNtK");
    @state(UInt64) reserveA = State<UInt64>();

    init() {
        super.init();
    }

    @method async create(amountA: UInt64) {
        const addressA = Balancer.tokenA;
        const amountReserve = this.reserveA.getAndRequireEquals();

        amountReserve.assertEquals(UInt64.zero);
        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");

        let tokenContractA = new TokenStandard(addressA);

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        await tokenContractA.transfer(sender, this.address, amountA);

        this.reserveA.set(amountA);
    }

    @method async depositToken(amount: UInt64) {
        const addressA = Balancer.tokenA;

        addressA.isEmpty().assertFalse("No tokenA defined");
        let tokenContractA = new TokenStandard(addressA);

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        await tokenContractA.transfer(sender, this.address, amount);
        let reserveA = this.reserveA.getAndRequireEquals();
        this.reserveA.set(reserveA.add(amount));
    }

    @method.returns(UInt64) async getBalance() {

        const addressA = Balancer.tokenA;

        let tokenContractA = new TokenStandard(addressA);

        const holderA = new TokenHolder(this.address, tokenContractA.deriveTokenId());

        const balanceA = holderA.account.balance.getAndRequireEquals();

        return balanceA;
    }

    @method async withdrawFromBalance(amount: UInt64) {
        const addressA = Balancer.tokenA;
        let tokenContractA = new TokenStandard(addressA);
        let tokenHolderOut = new BalancerHolder(this.address, tokenContractA.deriveTokenId());
        await tokenHolderOut.withdrawBalance(this.address, amount);

        let sender = this.sender.getUnconstrained();
        await tokenContractA.transfer(tokenHolderOut.self, sender, amount)

        let reserveA = this.reserveA.getAndRequireEquals();
        this.reserveA.set(reserveA.sub(amount));
    }

    @method async withdrawFromReserve(amount: UInt64) {
        const addressA = Balancer.tokenA;
        let tokenContractA = new TokenStandard(addressA);
        let tokenHolderOut = new BalancerHolder(this.address, tokenContractA.deriveTokenId());
        await tokenHolderOut.withdrawReserve(this.address, amount);

        let sender = this.sender.getUnconstrained();
        await tokenContractA.transfer(tokenHolderOut.self, sender, amount)

        let reserveA = this.reserveA.getAndRequireEquals();
        this.reserveA.set(reserveA.sub(amount));
    }

}
