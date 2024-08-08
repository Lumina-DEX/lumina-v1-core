import { Field, SmartContract, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable } from 'o1js';
import { TokenStandard, MinaTokenHolder, mulDiv } from './index.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    tokenA: PublicKey;
}


/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolMina extends TokenContractV2 {
    // we need the token address to instantiate it
    @state(PublicKey) tokenA = State<PublicKey>();
    @state(UInt64) liquiditySupply = State<UInt64>();

    async deploy(args: PoolMinaDeployProps) {
        await super.deploy(args);
        args.tokenA.isEmpty().assertFalse("token empty");
        this.tokenA.set(args.tokenA);
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async supplyFirstLiquidities(amountA: UInt64, amountMina: UInt64) {
        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");
        amountMina.assertGreaterThan(UInt64.zero, "No amount Mina supplied");
        const liquidityAmount = amountA.add(amountMina);

        // https://docs.openzeppelin.com/contracts/4.x/erc4626#inflation-attack, check if necessary in our case
        liquidityAmount.assertGreaterThan(minimunLiquidity, "Insufficient amount to mint liquidities");

        let tokenContractA = new TokenStandard(this.tokenA.getAndRequireEquals());

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getAndRequireSignature();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await tokenContractA.transfer(sender, this.address, amountA);
        await senderUpdate.send({ to: this, amount: amountMina });

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB - minimal liquidity, todo check overflow  
        // => maintains ratio a/l, b/l       
        const liquidityUser = liquidityAmount.sub(minimunLiquidity);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityUser });

        // set default informations
        this.liquiditySupply.set(liquidityAmount);
    }

    @method async supplyLiquidityFromTokenA(amountA: UInt64, maxAmountMina: UInt64) {
        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");

        let tokenContractA = new TokenStandard(this.tokenA.getAndRequireEquals());

        const holderA = new MinaTokenHolder(this.address, tokenContractA.deriveTokenId());
        const holderB = new MinaTokenHolder(this.address);

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

        let tokenContractA = new TokenStandard(this.tokenA.getAndRequireEquals());

        const holderA = new MinaTokenHolder(this.address, tokenContractA.deriveTokenId());
        const holderB = new MinaTokenHolder(this.address);

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

    @method async swapFromMina(amountIn: UInt64, amountOutMin: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

        // we request token out because this is the token holder who update his balance to transfer out
        let tokenContractOut = new TokenStandard(this.tokenA.getAndRequireEquals());
        let tokenHolderOut = new MinaTokenHolder(this.address, tokenContractOut.deriveTokenId());

        // will transfer token in to this pool and calculate correct amount out to transfer the token out
        const amountOut = await tokenHolderOut.swap(this.address, amountIn, amountOutMin);

        // transfer In before transfer out        
        let sender = this.sender.getUnconstrained();
        let accountUser = AccountUpdate.createSigned(sender);
        await accountUser.send({ to: this, amount: amountIn });
        await tokenContractOut.transfer(tokenHolderOut.self, sender, amountOut);
    }

    @method async swapFromToken(amountIn: UInt64, amountOutMin: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

        const tokenContractA = new TokenStandard(this.tokenA.getAndRequireEquals());
        const holderA = new MinaTokenHolder(this.address, tokenContractA.deriveTokenId());

        const reserveIn = holderA.account.balance.getAndRequireEquals();
        const reserveOut = this.account.balance.getAndRequireEquals();

        let amountOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        let sender = this.sender.getUnconstrained();

        // send token A to contract
        await tokenContractA.transfer(sender, this.address, amountIn);
        // send mina to user
        await this.send({ to: sender, amount: amountOut });

    }

}
