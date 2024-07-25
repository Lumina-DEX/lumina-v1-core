import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable } from 'o1js';
import { TokenStandard, TokenHolder, mulDiv, BalancerHolder } from './index.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

/**
 * Pool contract for Lumina dex
 */
export class Balancer extends SmartContract {
    // we need the token address to instantiate it
    @state(PublicKey) tokenA = State<PublicKey>();
    @state(UInt64) reserveA = State<UInt64>();

    init() {
        super.init();
    }

    @method async depositToken(tokenA: PublicKey, amountA: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();
        const amountReserve = this.reserveA.getAndRequireEquals();

        addressA.isEmpty().assertTrue("Balancer already initialised");
        amountReserve.assertEquals(UInt64.zero);
        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");

        let tokenContractA = new TokenStandard(tokenA);

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        await tokenContractA.transfer(sender, this.address, amountA);

        this.reserveA.set(amountA);
    }

    @method.returns(UInt64) async getBalance() {

        const addressA = this.tokenA.getAndRequireEquals();

        let tokenContractA = new TokenStandard(addressA);

        const holderA = new TokenHolder(this.address, tokenContractA.deriveTokenId());

        const balanceA = holderA.account.balance.getAndRequireEquals();

        return balanceA;
    }

    @method async withdrawFromBalance(amount: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();
        let tokenContractA = new TokenStandard(addressA);
        let tokenHolderOut = new BalancerHolder(this.address, tokenContractA.deriveTokenId());
        await tokenHolderOut.withdrawBalance(this.address, amount);

        let sender = this.sender.getUnconstrained();
        await tokenContractA.transfer(tokenHolderOut.self, sender, amount)

        let reserveA = this.reserveA.getAndRequireEquals();
        this.reserveA.set(reserveA.sub(amount));
    }

    @method async withdrawFromReserve(amount: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();
        let tokenContractA = new TokenStandard(addressA);
        let tokenHolderOut = new BalancerHolder(this.address, tokenContractA.deriveTokenId());
        await tokenHolderOut.withdrawReserve(this.address, amount);

        let sender = this.sender.getUnconstrained();
        await tokenContractA.transfer(tokenHolderOut.self, sender, amount)

        let reserveA = this.reserveA.getAndRequireEquals();
        this.reserveA.set(reserveA.sub(amount));
    }

}
