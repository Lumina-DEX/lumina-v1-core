import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate } from 'o1js';
import { TokenStandard } from './TokenStandard';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

/**
 * Pool contract for Lumina dex
 */
export class Pool extends TokenContract {
    // we need the token address to instantiate it
    @state(PublicKey) tokenA = State<PublicKey>();
    @state(PublicKey) tokenB = State<PublicKey>();
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

        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");
        amountB.assertGreaterThan(UInt64.zero, "No amount B supplied");

        let tokenContractA = new TokenStandard(addressA);
        let tokenContractB = new TokenStandard(addressB);

        const holderA = AccountUpdate.create(this.address, tokenContractA.deriveTokenId());
        const holderB = AccountUpdate.create(this.address, tokenContractB.deriveTokenId());
        const balanceA = holderA.account.balance.getAndRequireEquals();
        const balanceB = holderB.account.balance.getAndRequireEquals();

        balanceA.equals(UInt64.zero).assertTrue("First liquidity already supplied");
        balanceB.equals(UInt64.zero).assertTrue("First liquidity already supplied");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        tokenContractA.transfer(sender, this.address, amountA);
        tokenContractB.transfer(sender, this.address, amountB);


        // https://docs.openzeppelin.com/contracts/4.x/erc4626#inflation-attack, check if necessary in our case
        amountA.add(amountB).assertGreaterThan(minimunLiquidity, "Insufficient amount to mint liquidities");

        tokenContractA.transfer(sender, this.address, amountA);
        tokenContractB.transfer(sender, this.address, amountB);


        // calculate liquidity token output simply as liquidityAmount = amountA + amountB - minimal liquidity, todo check overflow  
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountA.add(amountB).sub(minimunLiquidity);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set default informations
        this.tokenA.set(tokenA);
        this.tokenB.set(tokenB);
        this.liquiditySupply.set(liquidityAmount.add(minimunLiquidity));
    }

    @method async supplyLiquidityFromA(amountA: UInt64, maxAmountB: UInt64) {
        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");

        const addressA = this.tokenA.getAndRequireEquals();
        const addressB = this.tokenB.getAndRequireEquals();

        // todo manage mina native token
        addressA.isEmpty().assertFalse("Pool not initialised");
        addressB.isEmpty().assertFalse("Pool not initialised");

        let tokenContractA = new TokenStandard(addressA);
        let tokenContractB = new TokenStandard(addressB);

        const holderA = AccountUpdate.create(this.address, tokenContractA.deriveTokenId());
        const holderB = AccountUpdate.create(this.address, tokenContractB.deriveTokenId());

        const balanceA = holderA.account.balance.getAndRequireEquals();
        const balanceB = holderB.account.balance.getAndRequireEquals();

        // amount B to supply
        const amountB = amountA.mul(balanceB).div(balanceA);

        amountB.assertGreaterThan(UInt64.zero, "No amount B to supply");
        amountB.assertLessThanOrEqual(maxAmountB, "Amount B greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        tokenContractA.transfer(sender, this.address, amountA);
        tokenContractB.transfer(sender, this.address, amountB);

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountA.add(amountB);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
    }


    @method async supplyLiquidityFromB(amountB: UInt64, maxAmountA: UInt64) {
        amountB.assertGreaterThan(UInt64.zero, "No amount B supplied");

        const addressA = this.tokenA.getAndRequireEquals();
        const addressB = this.tokenB.getAndRequireEquals();

        // todo manage mina native token
        addressA.isEmpty().assertFalse("Pool not initialised");
        addressB.isEmpty().assertFalse("Pool not initialised");

        let tokenContractA = new TokenStandard(addressA);
        let tokenContractB = new TokenStandard(addressB);

        const holderA = AccountUpdate.create(this.address, tokenContractA.deriveTokenId());
        const holderB = AccountUpdate.create(this.address, tokenContractB.deriveTokenId());

        const balanceA = holderA.account.balance.getAndRequireEquals();
        const balanceB = holderB.account.balance.getAndRequireEquals();

        // amount B to supply
        const amountA = amountB.mul(balanceA).div(balanceB);

        amountA.assertGreaterThan(UInt64.zero, "No amount A to supply");
        amountA.assertLessThanOrEqual(maxAmountA, "Amount A greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        tokenContractA.transfer(sender, this.address, amountA);
        tokenContractB.transfer(sender, this.address, amountB);

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountA.add(amountB);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
    }

}
