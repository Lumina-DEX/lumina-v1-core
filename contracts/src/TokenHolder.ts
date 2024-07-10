import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate } from 'o1js';
import { Pool } from './Pool';
import { TokenStandard } from './TokenStandard';

/**
 * A minimal fungible token
 */
export class TokenHolder extends SmartContract {

    static poolAddress: PublicKey;

    init() {
        super.init();
    }


    // this works for both directions (in our case where both tokens use the same contract)
    @method.returns(UInt64)
    async swap(
        user: PublicKey,
        amountIn: UInt64,
        amountOutMin: UInt64
    ) {
        let pm = new Pool(TokenHolder.poolAddress);
        const addressA = pm.tokenA.getAndRequireEquals();
        const addressB = pm.tokenB.getAndRequireEquals();

        const tokenA = new TokenStandard(addressA);
        const tokenB = new TokenStandard(addressB);

        const holderA = AccountUpdate.create(this.address, tokenA.deriveTokenId());
        const holderB = AccountUpdate.create(this.address, tokenB.deriveTokenId());

        const balanceA = holderA.account.balance.getAndRequireEquals();
        const balanceB = holderB.account.balance.getAndRequireEquals();

        let reserveIn = Provable.if(tokenA.deriveTokenId().equals(this.tokenId), balanceB, balanceA);
        let reserveOut = Provable.if(tokenA.deriveTokenId().equals(this.tokenId), balanceA, balanceB);
        let addressIn = Provable.if(tokenA.deriveTokenId().equals(this.tokenId), addressB, addressA);
        let tokenIn = new TokenStandard(addressIn);

        reserveIn.assertGreaterThan(amountIn, "Insufficient reserve in");
        reserveOut.assertGreaterThan(amountOutMin, "Insufficient reserve out");

        // send token from user to us (i.e., to the same address as this but with the other token)
        await tokenIn.transfer(user, TokenHolder.poolAddress, amountIn);

        // No tax for the moment (probably in a next version), todo check overflow     
        let amountOut = reserveOut.mul(amountIn).div(reserveIn.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        // send token to the user
        let receiverAU = this.send({ to: user, amount: amountOut });
        receiverAU.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        return amountOut;
    }
}
