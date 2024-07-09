import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64 } from 'o1js';
import { TokenStandard } from './TokenStandard';

/**
 * Pool contract for Lumina dex
 */
export class Pool extends TokenContract {
    // we need the token address to instantiate it
    @state(PublicKey) tokenA = State<PublicKey>();
    @state(PublicKey) tokenB = State<PublicKey>();
    @state(UInt64) reserveA = State<UInt64>();
    @state(UInt64) reserveB = State<UInt64>();
    @state(UInt64) liquiditySupply = State<UInt64>();

    init() {
        super.init();
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async createPool(tokenA: PublicKey, tokenB: PublicKey, amountA: UInt64, amountB: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();
        const addressB = this.tokenB.getAndRequireEquals();

        addressA.isEmpty().assertTrue("Pool already initialised");
        addressB.isEmpty().assertTrue("Pool already initialised");

    }

    @method async supplyLiquidityBase(amountA: UInt64, amountB: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();
        const addressB = this.tokenB.getAndRequireEquals();
        const reserveA = this.reserveA.getAndRequireEquals();
        const reserveB = this.reserveB.getAndRequireEquals();

        reserveA.equals(UInt64.zero).assertTrue("First liquidity already supplied");
        reserveB.equals(UInt64.zero).assertTrue("First liquidity already supplied");

        let tokenContractA = new TokenStandard(addressA);
        let tokenContractB = new TokenStandard(addressB);

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        tokenContractA.transfer(sender, this.address, amountA);
        tokenContractB.transfer(sender, this.address, amountB);

        this.reserveA.set(reserveA.add(amountA));
        this.reserveB.set(reserveB.add(amountA));
    }



}
