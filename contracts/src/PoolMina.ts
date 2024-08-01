import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable } from 'o1js';
import { TokenStandard, TokenHolder } from './index.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolMina extends TokenContract {
    // we need the token address to instantiate it
    @state(PublicKey) tokenA = State<PublicKey>();
    @state(UInt64) liquiditySupply = State<UInt64>();

    init() {
        super.init();
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async createPool(tokenA: PublicKey, amountA: UInt64, amountMina: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();

        addressA.isEmpty().assertTrue("Pool already initialised");

        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");
        amountMina.assertGreaterThan(UInt64.zero, "No amount Mina supplied");

        let tokenContractA = new TokenStandard(tokenA);

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getAndRequireSignature();
        let senderUpdate = AccountUpdate.createSigned(sender);

        // https://docs.openzeppelin.com/contracts/4.x/erc4626#inflation-attack, check if necessary in our case
        amountA.add(amountMina).assertGreaterThan(minimunLiquidity, "Insufficient amount to mint liquidities");

        await tokenContractA.transfer(sender, this.address, amountA);
        await senderUpdate.send({ to: this.address, amount: amountMina });

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB - minimal liquidity, todo check overflow  
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountA.add(amountMina).sub(minimunLiquidity);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set default informations
        this.tokenA.set(tokenA);
        this.liquiditySupply.set(liquidityAmount.add(minimunLiquidity));
    }

    @method async supplyLiquidityFromTokenA(amountA: UInt64, maxAmountMina: UInt64) {
        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");

        const addressA = this.tokenA.getAndRequireEquals();

        // todo manage mina native token
        addressA.isEmpty().assertFalse("Pool not initialised");

        let tokenContractA = new TokenStandard(addressA);

        const holderA = new TokenHolder(this.address, tokenContractA.deriveTokenId());
        const holderB = new TokenHolder(this.address);

        const balanceA = holderA.account.balance.getAndRequireEquals();
        const balanceB = holderB.account.balance.getAndRequireEquals();

        // amount Y to supply
        const amountMina = amountA.mul(balanceB).div(balanceA);

        amountMina.assertGreaterThan(UInt64.zero, "No Mina amount to supply");
        amountMina.assertLessThanOrEqual(maxAmountMina, "Mina amount greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await tokenContractA.transfer(sender, this.address, amountA);
        await senderUpdate.send({ to: this.address, amount: amountMina });

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountA.add(amountMina);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
    }

    @method async supplyLiquidityFromMina(amountMina: UInt64, maxAmountA: UInt64) {
        amountMina.assertGreaterThan(UInt64.zero, "No Mina amount supplied");

        const addressA = this.tokenA.getAndRequireEquals();

        // todo manage mina native token
        addressA.isEmpty().assertFalse("Pool not initialised");

        let tokenContractA = new TokenStandard(addressA);

        const holderA = new TokenHolder(this.address, tokenContractA.deriveTokenId());
        const holderB = new TokenHolder(this.address);

        const balanceA = holderA.account.balance.getAndRequireEquals();
        const balanceB = holderB.account.balance.getAndRequireEquals();

        // amount Y to supply
        const amountA = amountMina.mul(balanceA).div(balanceB);

        amountA.assertGreaterThan(UInt64.zero, "No amount A to supply");
        amountA.assertLessThanOrEqual(maxAmountA, "Amount A greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await tokenContractA.transfer(sender, this.address, amountA);
        await senderUpdate.send({ to: this.address, amount: amountMina });

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountA.add(amountMina);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
    }

    // @method async swapExactAmountIn(amountIn: UInt64, amountOutMin: UInt64) {
    //     amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
    //     amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

    //     const addressA = this.tokenA.getAndRequireEquals();

    //     // todo manage mina native token
    //     addressA.isEmpty().assertFalse("Pool not initialised");

    //     // we request token out because this is the token holder who update his balance to transfer out
    //     let tokenOut = Provable.if(tokenIn.equals(addressA), addressB, addressA);
    //     let tokenContractOut = new TokenStandard(tokenOut);
    //     let tokenHolderOut = new TokenHolder(this.address, tokenContractOut.deriveTokenId());

    //     // require signature on transfer, so don't need to request it now
    //     let sender = this.sender.getUnconstrained();

    //     // will transfer token in to this pool and calculate correct amount out to transfer the token out
    //     const amountOut = await tokenHolderOut.swap(this.address, sender, amountIn, amountOutMin);
    //     await tokenContractOut.transfer(tokenHolderOut.self, sender, amountOut);
    // }

}