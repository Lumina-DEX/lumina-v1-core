import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey } from 'o1js';
import { PoolMina, mulDiv, SwapEvent, PoolData } from './indexmina.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class PoolTokenHolder extends SmartContract {

    events = {
        swap: SwapEvent,
        upgrade: Field
    };

    async deploy() {
        await super.deploy();

        Bool(false).assertTrue("You can't directly deploy a token holder");
    }

    /**
    * Upgrade to a new version
    * @param vk new verification key
    */
    @method async updateVerificationKey(vk: VerificationKey) {
        const pool = new PoolMina(this.address);
        const poolDataAddress = await pool.getPoolData();
        const poolData = new PoolData(poolDataAddress);
        const owner = await poolData.getOwner();

        // only owner can update a pool
        AccountUpdate.createSigned(owner);

        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }

    // swap from mina to this token through the pool
    @method async swapFromMina(frontend: PublicKey, taxFeeFrontend: UInt64, amountMinaIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64
    ) {
        amountMinaIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountTokenOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountTokenOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves");
        taxFeeFrontend.assertLessThanOrEqual(PoolMina.maxFee, "Frontend fee exceed max fees");

        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        // calculate amount token out, No tax for the moment (probably in a next version),   
        let amountOutBeforeFee = mulDiv(balanceOutMin, amountMinaIn, balanceInMax.add(amountMinaIn));
        // 0.20% tax fee for liquidity provider directly on amount out
        const feeLP = mulDiv(amountOutBeforeFee, UInt64.from(2), UInt64.from(1000));
        // 0.15% fee max for the frontend
        const feeFrontend = mulDiv(amountOutBeforeFee, taxFeeFrontend, UInt64.from(10000));

        let amountOut = amountOutBeforeFee.sub(feeLP).sub(feeFrontend);
        amountOut.assertGreaterThanOrEqual(amountTokenOutMin, "Insufficient amount out");

        let sender = this.sender.getUnconstrainedV2();

        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountOut })
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
        // send fee to frontend (if not empty)
        const frontendReceiver = Provable.if(frontend.equals(PublicKey.empty()), this.address, frontend);
        let frontendUpdate = await this.send({ to: frontendReceiver, amount: feeFrontend });
        frontendUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        let pool = new PoolMina(this.address);
        await pool.swapFromMina(amountMinaIn, balanceInMax);

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

        const sender = this.sender.getUnconstrainedV2();
        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountToken });
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        await pool.withdrawLiquidity(liquidityAmount, amountMinaMin, amountToken, reserveMinaMin, supplyMax);
    }

}
