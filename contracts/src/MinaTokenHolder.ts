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
            setVerificationKey:
                Permissions.VerificationKey.impossibleDuringCurrentVersion(),
            setPermissions: Permissions.impossible(),
        });
    }

    // swap from mina to this token through the pool
    @method async swapFromMina(
        amountIn: UInt64,
        amountOutExpected: UInt64,
        balanceMin: UInt64,
        balanceMax: UInt64
    ) {
        const poolAccount = AccountUpdate.create(this.address);

        poolAccount.account.balance.requireBetween(UInt64.one, balanceMax);
        this.account.balance.requireBetween(balanceMin, UInt64.MAXINT());

        // calculate amount token out, No tax for the moment (probably in a next version),   
        let amountOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));
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
        totalSupply: UInt64
    ) {
        let pool = new PoolMina(this.address);

        const balanceToken = this.account.balance.getAndRequireEquals();

        // calculate amount token out
        const amountToken = mulDiv(liquidityAmount, balanceToken, totalSupply);

        const sender = this.sender.getUnconstrained();
        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountToken });
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        await pool.withdrawLiquidity(liquidityAmount, totalSupply);
    }

}
