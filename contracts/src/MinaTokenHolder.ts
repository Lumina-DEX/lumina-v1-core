import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account } from 'o1js';
import { PoolMina, TokenStandard, mulDiv } from './indexmina.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class MinaTokenHolder extends SmartContract {
    init() {
        super.init();
    }

    // this works for both directions (in our case where both tokens use the same contract)
    @method.returns(UInt64)
    async swap(
        amountIn: UInt64,
        amountOutMin: UInt64
    ) {
        const poolMina = new PoolMina(this.address);

        const balanceMina = poolMina.account.balance.getAndRequireEquals();
        const balanceToken = this.account.balance.getAndRequireEquals();


        // this account = Address + derive token
        const reserveIn = balanceMina;
        const reserveOut = balanceToken;

        Provable.log("reserveIn", reserveIn);
        Provable.log("reserveOut", reserveOut);

        reserveIn.assertGreaterThan(amountIn, "Insufficient reserve in");

        // No tax for the moment (probably in a next version), todo check overflow     
        let amountOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        reserveOut.assertGreaterThan(amountOut, "Insufficient reserve out");

        // send token to the user
        this.balance.subInPlace(amountOut);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;

        return amountOut;
    }

    // check if they are no exploit possible
    @method.returns(UInt64)
    async withdrawLiquidity(
        poolAddress: PublicKey,
        liquidityAmount: UInt64
    ) {
        let pm = new PoolMina(poolAddress);
        const totalSupply = pm.liquiditySupply.getAndRequireEquals();

        const tokenA = new TokenStandard(pm.token.getAndRequireEquals());

        const holderA = new MinaTokenHolder(poolAddress, tokenA.deriveTokenId());

        // prevent from swap from bad pool, address holderA need to match this address
        this.address.equals(holderA.address).assertTrue("Incorrect token address");

        const reserve = holderA.account.balance.getAndRequireEquals();

        // todo overflow check
        const amountOut = mulDiv(liquidityAmount, reserve, totalSupply);

        // send token to the user
        this.balance.subInPlace(amountOut);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;

        return amountOut;
    }
}
