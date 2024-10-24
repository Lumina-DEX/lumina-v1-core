import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey } from 'o1js';
import { PoolMina, FungibleToken, mulDiv, SwapEvent } from './indexmina.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class MinaTokenHolder extends SmartContract {

    events = {
        swap: SwapEvent,
        upgrade: Field
    };

    init() {
        super.init();

        this.account.permissions.set({
            ...Permissions.default(),
            send: Permissions.proof(),
            setVerificationKey: Permissions.VerificationKey.proofOrSignature()
        });
    }

    /**
 * Upgrade to a new version
 * @param vk new verification key
 */
    @method async updateVerificationKey(vk: VerificationKey) {
        // todo implement check
        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }


    // swap from mina to this token through the pool
    @method async swapFromMina(amountMinaIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64
    ) {
        amountMinaIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountTokenOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountTokenOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves");

        const poolAccount = AccountUpdate.create(this.address);

        poolAccount.account.balance.requireBetween(UInt64.one, balanceInMax);
        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        // calculate amount token out, No tax for the moment (probably in a next version),   
        let amountOut = mulDiv(balanceOutMin, amountMinaIn, balanceInMax.add(amountMinaIn));
        amountOut.assertGreaterThanOrEqual(amountTokenOutMin, "Insufficient amount out");

        // transfer token in to this pool      
        let sender = this.sender.getUnconstrained();
        let senderSigned = AccountUpdate.createSigned(sender);
        senderSigned.send({ to: poolAccount, amount: amountMinaIn });

        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountOut })
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        this.emitEvent("swap", new SwapEvent({ sender, amountIn: amountMinaIn, amountOut }));
    }


    // check if they are no exploit possible  
    @method async withdrawLiquidity(liquidityAmount: UInt64, amountMinaMin: UInt64, amountTokenMin: UInt64, reserveMinaMin: UInt64, reserveTokenMin: UInt64, supplyMax: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero");
        reserveTokenMin.assertGreaterThan(UInt64.zero, "Reserve token min can't be zero");
        amountTokenMin.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero");

        let pool = new PoolMina(this.address);

        this.account.balance.requireBetween(reserveTokenMin, UInt64.MAXINT());

        // calculate amount token out
        const amountToken = mulDiv(liquidityAmount, reserveTokenMin, supplyMax);
        amountToken.assertGreaterThanOrEqual(amountTokenMin, "Insufficient amount token out");

        const sender = this.sender.getUnconstrained();
        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountToken });
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        await pool.withdrawLiquidity(liquidityAmount, amountMinaMin, amountToken, reserveMinaMin, supplyMax);
    }

}
