import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer } from 'o1js';
import { PoolMina, FungibleToken, mulDiv } from './indexmina.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class MinaTokenHolder extends SmartContract {

    init() {
        super.init();

        this.account.permissions.set({
            ...Permissions.default(),
            send: Permissions.proof(),
            setVerificationKey: Permissions.VerificationKey.proofOrSignature()
        });
    }

    // swap from mina to this token through the pool
    @method async swapFromMina(
        amountIn: UInt64,
        amountOutExpected: UInt64,
        balanceOutMin: UInt64,
        balanceInMax: UInt64
    ) {
        amountIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountOutExpected.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountOutExpected.assertLessThan(balanceOutMin, "Amount out exceeds reserves");

        const poolAccount = AccountUpdate.create(this.address);

        poolAccount.account.balance.requireBetween(UInt64.one, balanceInMax);
        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        // calculate amount token out, No tax for the moment (probably in a next version),   
        let amountOut = mulDiv(balanceOutMin, amountIn, balanceInMax.add(amountIn));
        amountOut.equals(amountOutExpected).assertTrue("Incorrect amount out calculation");

        // transfer token in to this pool      
        let sender = this.sender.getUnconstrained();
        let senderSigned = AccountUpdate.createSigned(sender);
        senderSigned.send({ to: poolAccount, amount: amountIn });

        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountOut })
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
    }


    // check if they are no exploit possible  
    @method async withdrawLiquidity(
        liquidityAmount: UInt64,
        amountMinaExpected: UInt64,
        amountTokenExpected: UInt64,
        reserveMinaMin: UInt64,
        reserveTokenMin: UInt64,
        supplyMax: UInt64
    ) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero");
        reserveTokenMin.assertGreaterThan(UInt64.zero, "Reserve token min can't be zero");
        amountTokenExpected.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero");

        let pool = new PoolMina(this.address);

        this.account.balance.requireBetween(reserveTokenMin, UInt64.MAXINT());

        // calculate amount token out
        const amountToken = mulDiv(liquidityAmount, reserveTokenMin, supplyMax);
        amountToken.equals(amountTokenExpected).assertTrue("Incorrect amount token out");

        const sender = this.sender.getUnconstrained();
        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountToken });
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        await pool.withdrawLiquidity(liquidityAmount, amountMinaExpected, reserveMinaMin, supplyMax);
    }

}
