import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer } from 'o1js';
import { PoolMina, FungibleToken, mulDiv } from './indexmina.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class MinaTokenHolder extends SmartContract {

    @state(Field) redeemActionState = State<Field>();
    static redeemActionBatchSize = 1;

    init() {
        super.init();

        this.account.permissions.set({
            ...Permissions.default(),
            send: Permissions.proof(),
            setVerificationKey:
                Permissions.VerificationKey.impossibleDuringCurrentVersion(),
            setPermissions: Permissions.impossible(),
        });

        this.redeemActionState.set(Reducer.initialActionState);
    }

    // swap from mina to this token directly
    @method.returns(UInt64)
    async swapFromMina(
        amountIn: UInt64,
        amountOutMin: UInt64
    ) {
        const poolMina = AccountUpdate.create(this.address).account;

        const balanceMina = poolMina.balance.getAndRequireEquals();
        const balanceToken = this.account.balance.getAndRequireEquals();
        balanceToken.greaterThan(UInt64.zero);

        const accountUser = this.sender.getUnconstrained();
        const sender = AccountUpdate.createSigned(accountUser);

        sender.send({ to: this.address, amount: amountIn });


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
        let receiverUpdate = this.send({ to: accountUser, amount: amountOutMin })
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent
        receiverUpdate.body.useFullCommitment = Bool(true)


        return amountOutMin;
    }

    // swap from mina to this token through the pool
    @method.returns(UInt64)
    async swap(
        amountIn: UInt64,
        amountOutMin: UInt64,
        balanceMin: UInt64,
        balanceMax: UInt64
    ) {
        const poolAccount = AccountUpdate.create(this.address);

        poolAccount.account.balance.requireBetween(UInt64.one, balanceMax);
        this.account.balance.requireBetween(balanceMin, UInt64.MAXINT());

        // No tax for the moment (probably in a next version), todo check overflow     
        let amountOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        let sender = this.sender.getUnconstrained();
        let senderSigned = AccountUpdate.createSigned(sender);
        senderSigned.balance.subInPlace(amountIn);

        // transfer token in to this pool      
        poolAccount.balance.addInPlace(amountIn);

        // send token to the user
        this.balance.subInPlace(amountOut);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;


        return amountOut;

    }

    // check if they are no exploit possible
    @method.returns(UInt64)
    async withdrawLiquidity(
        liquidityAmount: UInt64,
        totalSupply: UInt64
    ) {
        let pool = new PoolMina(this.address);

        const balanceToken = this.account.balance.getAndRequireEquals();

        // todo overflow check
        const amountToken = mulDiv(liquidityAmount, balanceToken, totalSupply);

        const sender = this.sender.getUnconstrained();
        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountToken })
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent
        receiverUpdate.body.useFullCommitment = Bool(true)

        await pool.withdrawLiquidity(liquidityAmount, totalSupply);

        return amountToken;
    }


    @method async redeemLiquidityFinalize(totalSupply: UInt64) {
        // get redeem actions
        let pool = new PoolMina(this.address);

        let fromActionState = this.redeemActionState.getAndRequireEquals();
        let actions = pool.reducer.getActions();

        // get our token balance
        let balanceToken = this.account.balance.getAndRequireEquals();

        pool.reducer.forEach(
            actions,
            ({ owner, amount }) => {
                // for every user that redeemed liquidity, we calculate the token output
                // and create a child account update which pays the user
                const amountToken = mulDiv(amount, balanceToken, totalSupply);
                let receiver = this.send({ to: owner, amount: amountToken });
                // note: this should just work when the reducer gives us dummy data
                Provable.log("amounttoken", amountToken);
                // important: these child account updates inherit token permission from us
                receiver.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
            },
            {
                maxUpdatesWithActions: MinaTokenHolder.redeemActionBatchSize,
                // DEX contract doesn't allow setting preconditions from outside (= w/o proof)
                skipActionStatePrecondition: true,
            }
        );

        // update action state so these payments can't be triggered a 2nd time
        this.redeemActionState.set(actions.hash);

        // precondition on the DEX contract, to prove we used the right actions & token supply
        await pool.redeemLiquidityFinalize(actions.hash, totalSupply, fromActionState);
    }


    /**
     * Not secure at the moment
     * @param amount 
     */
    @method
    async moveAmount(
        amount: UInt64
    ) {
        // send token to the user
        this.balance.subInPlace(amount);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;
    }
}
