import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool } from 'o1js';
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
        liquidityAmount: UInt64
    ) {
        let pool = new PoolMina(this.address);

        const balanceToken = this.account.balance.getAndRequireEquals();

        const liquidityAccount = AccountUpdate.create(this.address, pool.deriveTokenId());

        const totalSupply = liquidityAccount.account.balance.getAndRequireEquals();

        // todo overflow check
        const amountToken = mulDiv(liquidityAmount, balanceToken, totalSupply);

        // send token to the user
        this.balance.subInPlace(amountToken);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;

        await pool.burnLiquidity(this.sender.getUnconstrained(), liquidityAmount);

        return amountToken;
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
