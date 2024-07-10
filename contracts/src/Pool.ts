import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable } from 'o1js';
import { TokenStandard } from './TokenStandard';
import { TokenHolder } from './TokenHolder';

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

    @method async supplyLiquidityFromToken(tokenX: PublicKey, amountX: UInt64, maxAmountY: UInt64) {
        amountX.assertGreaterThan(UInt64.zero, "No amount A supplied");

        const addressA = this.tokenA.getAndRequireEquals();
        const addressB = this.tokenB.getAndRequireEquals();

        // todo manage mina native token
        addressA.isEmpty().assertFalse("Pool not initialised");
        addressB.isEmpty().assertFalse("Pool not initialised");

        tokenX.equals(addressA).or(tokenX.equals(addressB)).assertTrue("Incorrect token x");

        let tokenContractA = new TokenStandard(addressA);
        let tokenContractB = new TokenStandard(addressB);

        const holderA = AccountUpdate.create(this.address, tokenContractA.deriveTokenId());
        const holderB = AccountUpdate.create(this.address, tokenContractB.deriveTokenId());

        const balanceA = holderA.account.balance.getAndRequireEquals();
        const balanceB = holderB.account.balance.getAndRequireEquals();

        const balanceX = Provable.if(tokenX.equals(addressA), balanceA, balanceB);
        const balanceY = Provable.if(tokenX.equals(addressA), balanceB, balanceA);
        const addressY = Provable.if(tokenX.equals(addressA), addressB, addressA);

        let tokenContractX = new TokenStandard(tokenX);
        let tokenContractY = new TokenStandard(addressY);

        // amount Y to supply
        const amountY = amountX.mul(balanceY).div(balanceX);

        amountY.assertGreaterThan(UInt64.zero, "No amount Y to supply");
        amountY.assertLessThanOrEqual(maxAmountY, "Amount Y greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        tokenContractX.transfer(sender, this.address, amountX);
        tokenContractY.transfer(sender, this.address, amountY);

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountX.add(amountY);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
    }

    @method async swapExactAmountIn(tokenIn: PublicKey, amountIn: UInt64, amountOutMin: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

        const addressA = this.tokenA.getAndRequireEquals();
        const addressB = this.tokenB.getAndRequireEquals();

        // todo manage mina native token
        addressA.isEmpty().assertFalse("Pool not initialised");
        addressB.isEmpty().assertFalse("Pool not initialised");

        tokenIn.equals(addressA).or(tokenIn.equals(addressB)).assertTrue("Incorrect token in");

        let tokenContractIn = new TokenStandard(tokenIn);
        let tokenHolderIn = new TokenHolder(this.address, tokenContractIn.deriveTokenId());

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();

        await tokenHolderIn.swap(sender, amountIn, amountOutMin);
    }

}
