import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate } from 'o1js';
import { Pool } from './Pool';
import { TokenStandard } from './TokenStandard';

/**
 * A minimal fungible token
 */
export class TokenHolder extends SmartContract {
    init() {
        super.init();
    }

    // this works for both directions (in our case where both tokens use the same contract)
    @method.returns(UInt64)
    async swap(
        poolAddress: PublicKey,
        user: PublicKey,
        amountIn: UInt64,
        amountOutMin: UInt64
    ) {
        let pm = new Pool(poolAddress);
        const addressA = pm.tokenA.getAndRequireEquals();
        const addressB = pm.tokenB.getAndRequireEquals();

        const tokenA = new TokenStandard(addressA);
        const tokenB = new TokenStandard(addressB);

        const holderA = new TokenHolder(poolAddress, tokenA.deriveTokenId());
        const holderB = new TokenHolder(poolAddress, tokenB.deriveTokenId());

        // prevent from swap from bad pool, one of the 2 tokens of the pool need to match this address
        this.address.equals(holderA.address).or(this.address.equals(holderB.address)).assertTrue("Incorrect token address");

        const balanceA = holderA.account.balance.getAndRequireEquals();
        const balanceB = holderB.account.balance.getAndRequireEquals();

        let reserveIn = Provable.if(tokenA.deriveTokenId().equals(this.tokenId), balanceB, balanceA);
        let reserveOut = Provable.if(tokenA.deriveTokenId().equals(this.tokenId), balanceA, balanceB);
        let addressIn = Provable.if(tokenA.deriveTokenId().equals(this.tokenId), addressB, addressA);
        let tokenIn = new TokenStandard(addressIn);

        reserveIn.assertGreaterThan(amountIn, "Insufficient reserve in");
        reserveOut.assertGreaterThan(amountOutMin, "Insufficient reserve out");

        // send token from user to us (i.e., to the same address as this but with the other token)
        await tokenIn.transfer(user, poolAddress, amountIn);

        // No tax for the moment (probably in a next version), todo check overflow     
        let amountOut = reserveOut.mul(amountIn).div(reserveIn.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        // send token to the user
        this.balance.subInPlace(amountOut);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;

        return amountOut;
    }
}
