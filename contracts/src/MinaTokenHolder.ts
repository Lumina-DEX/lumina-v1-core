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

    // swap from mina to this token directly through the pool
    @method.returns(UInt64)
    async swap(
        poolAccount: AccountUpdate,
        amountIn: UInt64,
        amountOutMin: UInt64
    ) {
        const balanceMina = poolAccount.account.balance.getAndRequireEquals();
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
        const poolMina = AccountUpdate.create(this.address, pm.deriveTokenId());
        const totalSupply = poolMina.account.balance.getAndRequireEquals();

        const tokenA = new FungibleToken(pm.token.getAndRequireEquals());

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
