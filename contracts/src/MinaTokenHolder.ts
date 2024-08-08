import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account } from 'o1js';
import { Pool, TokenStandard, mulDiv } from './index.js';
import { PoolMina } from './PoolMina.js';

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
        accountUser: AccountUpdate,
        amountIn: UInt64,
        amountOutMin: UInt64
    ) {
        const minaAccount = AccountUpdate.create(this.address);

        // this account = Address + derive token
        const reserveIn = this.account.balance.getAndRequireEquals();
        const reserveOut = minaAccount.account.balance.getAndRequireEquals();

        Provable.log("reserveIn", reserveIn);
        Provable.log("reserveOut", reserveOut);

        reserveIn.assertGreaterThan(amountIn, "Insufficient reserve in");

        // No tax for the moment (probably in a next version), todo check overflow     
        let amountOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        reserveOut.assertGreaterThan(amountOut, "Insufficient reserve out");

        await accountUser.send({ to: this.address, amount: amountIn });

        // send token to the user
        this.balance.subInPlace(amountOut);
        //this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;

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

        const tokenA = new TokenStandard(pm.tokenA.getAndRequireEquals());

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
