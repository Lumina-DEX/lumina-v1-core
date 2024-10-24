import { Field, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct, CircuitString, assert, Types } from 'o1js';
import { BalanceChangeEvent, FungibleToken, mulDiv, PoolTokenHolder } from './indexmina.js';

export class SwapEvent extends Struct({
    sender: PublicKey,
    amountIn: UInt64,
    amountOut: UInt64
}) {
    constructor(value: {
        sender: PublicKey,
        amountIn: UInt64,
        amountOut: UInt64,
    }) {
        super(value);
    }
}

export class AddLiquidityEvent extends Struct({
    sender: PublicKey,
    amountMinaIn: UInt64,
    amountTokenIn: UInt64,
    amountLiquidityOut: UInt64
}) {
    constructor(value: {
        sender: PublicKey,
        amountMinaIn: UInt64,
        amountTokenIn: UInt64,
        amountLiquidityOut: UInt64
    }) {
        super(value);
    }
}

export class WithdrawLiquidityEvent extends Struct({
    sender: PublicKey,
    amountLiquidityIn: UInt64,
    amountMinaOut: UInt64,
    amountTokenOut: UInt64,
}) {
    constructor(value: {
        sender: PublicKey,
        amountLiquidityIn: UInt64,
        amountMinaOut: UInt64,
        amountTokenOut: UInt64,
    }) {
        super(value);
    }
}


/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolMina extends TokenContractV2 {
    // we need the token address to instantiate it
    @state(PublicKey) token = State<PublicKey>();
    @state(PublicKey) protocol = State<PublicKey>();

    events = {
        swap: SwapEvent,
        addLiquidity: AddLiquidityEvent,
        withdrawLiquidity: WithdrawLiquidityEvent,
        BalanceChange: BalanceChangeEvent
    };

    async deploy() {
        await super.deploy();

        Bool(false).assertTrue("You can't directly deploy a pool");
    }

    /** Approve `AccountUpdate`s that have been created outside of the token contract.
      *
      * @argument {AccountUpdateForest} updates - The `AccountUpdate`s to approve. Note that the forest size is limited by the base token contract, @see TokenContractV2.MAX_ACCOUNT_UPDATES The current limit is 9.
      */
    @method
    async approveBase(updates: AccountUpdateForest): Promise<void> {
        let totalBalance = Int64.from(0)
        this.forEachUpdate(updates, (update, usesToken) => {
            // Make sure that the account permissions are not changed
            this.checkPermissionsUpdate(update)
            this.emitEventIf(
                usesToken,
                "BalanceChange",
                new BalanceChangeEvent({ address: update.publicKey, amount: update.balanceChange }),
            )

            // Don't allow transfers to/from the account that's tracking circulation
            update.publicKey.equals(this.address).and(usesToken).assertFalse(
                "Can't transfer to/from the circulation account"
            )
            totalBalance = Provable.if(usesToken, totalBalance.add(update.balanceChange), totalBalance)
            totalBalance.isPositiveV2().assertFalse(
                "Flash-minting or unbalanced transaction detected"
            )
        })
        totalBalance.assertEquals(Int64.zero, "Unbalanced transaction")
    }

    private checkPermissionsUpdate(update: AccountUpdate) {
        let permissions = update.update.permissions

        let { access, receive } = permissions.value
        let accessIsNone = Provable.equal(Types.AuthRequired, access, Permissions.none())
        let receiveIsNone = Provable.equal(Types.AuthRequired, receive, Permissions.none())
        let updateAllowed = accessIsNone.and(receiveIsNone)

        assert(
            updateAllowed.or(permissions.isSome.not()),
            "Can't change permissions for access or receive on token accounts"
        )
    }

    @method
    async transfer(from: PublicKey, to: PublicKey, amount: UInt64) {
        from.equals(this.address).assertFalse("Can't transfer to/from the circulation account");
        to.equals(this.address).assertFalse("Can't transfer to/from the circulation account");
        this.internal.send({ from, to, amount })
    }


    @method.returns(UInt64) async supplyFirstLiquidities(amountMina: UInt64, amountToken: UInt64) {
        const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId());
        const balanceLiquidity = circulationUpdate.account.balance.getAndRequireEquals();
        balanceLiquidity.equals(UInt64.zero).assertTrue("First liquidities already supplied");

        amountToken.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        amountMina.assertGreaterThan(UInt64.zero, "Amount mina can't be zero");

        // remove minimun liquidity amount, we mint token to the protocol fees
        const liquidityAmount = amountToken.add(amountMina);

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        // send mina to the pool
        let sender = this.sender.getUnconstrainedV2();
        sender.equals(this.address).assertFalse("Can't transfer to/from the pool account");
        let senderUpdate = AccountUpdate.createSigned(sender);
        senderUpdate.send({ to: this.self, amount: amountMina });

        // send token to the pool
        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        senderToken.send({ to: tokenAccount, amount: amountToken });

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // 0.1 % as protocol fees       
        const liquidityProtocol = liquidityAmount.div(1000);
        const liquidityUser = liquidityAmount.sub(liquidityProtocol);
        // mint token
        const protocol = this.protocol.getAndRequireEquals();
        this.internal.mint({ address: protocol, amount: liquidityProtocol });
        this.internal.mint({ address: sender, amount: liquidityUser });
        this.internal.mint({ address: circulationUpdate, amount: liquidityAmount });

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);

        this.emitEvent("addLiquidity", new AddLiquidityEvent({ sender, amountMinaIn: amountMina, amountTokenIn: amountToken, amountLiquidityOut: liquidityUser }));

        return liquidityUser;
    }

    @method.returns(UInt64) async supplyLiquidity(amountMina: UInt64, amountToken: UInt64, reserveMinaMax: UInt64, reserveTokenMax: UInt64, supplyMin: UInt64) {
        amountMina.assertGreaterThan(UInt64.zero, "Amount mina can't be zero");
        amountToken.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        reserveTokenMax.assertGreaterThan(UInt64.zero, "Reserve token max can't be zero");
        reserveMinaMax.assertGreaterThan(UInt64.zero, "Reserve mina max can't be zero");
        supplyMin.assertGreaterThan(UInt64.zero, "Supply min can't be zero");

        const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId());
        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        tokenAccount.account.balance.requireBetween(UInt64.one, reserveTokenMax);
        this.account.balance.requireBetween(UInt64.one, reserveMinaMax);
        circulationUpdate.account.balance.requireBetween(supplyMin, UInt64.MAXINT());

        // calculate liquidity token output simply as amountX * liquiditySupply / reserveX 
        const liquidityMina = mulDiv(amountMina, supplyMin, reserveMinaMax);
        const liquidityToken = mulDiv(amountToken, supplyMin, reserveTokenMax);
        // 0.1 % of error max between these 2 liquidities, prevent to send too much token or mina 
        const percentError = liquidityMina.div(1000);
        const liquidityMin = liquidityMina.sub(percentError);
        const liquidityMax = liquidityMina.add(percentError);
        liquidityMin.assertLessThanOrEqual(liquidityToken, "Too much mina supplied");
        liquidityMax.assertGreaterThanOrEqual(liquidityToken, "Too much token supplied");

        const liquidityAmount = Provable.if(liquidityMina.lessThan(liquidityToken), liquidityMina, liquidityToken);
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity out can't be zero");

        // send mina to the pool
        let sender = this.sender.getUnconstrainedV2();
        sender.equals(this.address).assertFalse("Can't transfer to/from the pool account");
        let senderUpdate = AccountUpdate.createSigned(sender);
        senderUpdate.send({ to: this.self, amount: amountMina });

        // send token to the pool
        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        senderToken.send({ to: tokenAccount, amount: amountToken });

        // 0.1 % as protocol fees       
        const liquidityProtocol = liquidityAmount.div(1000);
        const liquidityUser = liquidityAmount.sub(liquidityProtocol);
        // mint token
        const protocol = this.protocol.getAndRequireEquals();
        this.internal.mint({ address: protocol, amount: liquidityProtocol });
        this.internal.mint({ address: sender, amount: liquidityUser });
        this.internal.mint({ address: circulationUpdate, amount: liquidityAmount });

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);

        this.emitEvent("addLiquidity", new AddLiquidityEvent({ sender, amountMinaIn: amountMina, amountTokenIn: amountToken, amountLiquidityOut: liquidityUser }));

        return liquidityUser;
    }

    @method async swapFromToken(frontend: PublicKey, amountTokenIn: UInt64, amountMinaOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64) {
        amountTokenIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountMinaOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountMinaOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves");

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        tokenAccount.account.balance.requireBetween(UInt64.one, balanceInMax);
        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        // working on fee integration

        let amountOutBeforeFee = mulDiv(balanceOutMin, amountTokenIn, balanceInMax.add(amountTokenIn));
        // 0.25% tax fee directly on amount out
        const feeLP = amountOutBeforeFee.mul(2).div(1000);
        const feeFrontend = amountOutBeforeFee.mul(5).div(10000);

        let amountOut = amountOutBeforeFee.sub(feeLP).sub(feeFrontend);
        amountOut.assertGreaterThanOrEqual(amountMinaOutMin, "Insufficient amount out");

        // send token to the pool
        let sender = this.sender.getUnconstrainedV2();
        sender.equals(this.address).assertFalse("Can't transfer to/from the pool account");
        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        senderToken.send({ to: tokenAccount, amount: amountTokenIn });

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);

        // send mina to user
        await this.send({ to: sender, amount: amountOut });
        // send mina to frontend (if not empty)
        const frontendReceiver = Provable.if(frontend.equals(PublicKey.empty()), this.address, frontend);
        await this.send({ to: frontendReceiver, amount: feeFrontend });

        this.emitEvent("swap", new SwapEvent({ sender, amountIn: amountTokenIn, amountOut }));
    }

    /**
     * Don't call this method directly, use pool token holder or you will just lost mina
     * @param amountMinaIn mina amount in
     * @param balanceInMax actual reserve max in
     */
    @method async swapFromMina(amountMinaIn: UInt64, balanceInMax: UInt64) {
        amountMinaIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");

        this.account.balance.requireBetween(UInt64.one, balanceInMax);
        let sender = this.sender.getUnconstrainedV2();
        let senderSigned = AccountUpdate.createSigned(sender);
        await senderSigned.send({ to: this.self, amount: amountMinaIn });
    }

    @method async withdrawLiquidity(liquidityAmount: UInt64, amountMinaMin: UInt64, amountTokenOut: UInt64, reserveMinaMin: UInt64, supplyMax: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero");
        reserveMinaMin.assertGreaterThan(UInt64.zero, "Reserve mina min can't be zero");
        amountMinaMin.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero");

        this.account.balance.requireBetween(reserveMinaMin, UInt64.MAXINT());

        const sender = this.sender.getUnconstrainedV2();
        sender.equals(this.address).assertFalse("Can't transfer to/from the pool account");
        const liquidityAccount = AccountUpdate.create(this.address, this.deriveTokenId());
        liquidityAccount.account.balance.requireBetween(UInt64.one, supplyMax);

        const amountMina = mulDiv(liquidityAmount, reserveMinaMin, supplyMax);
        amountMina.assertGreaterThanOrEqual(amountMinaMin, "Insufficient amount mina out");

        // burn liquidity from user and current supply
        liquidityAccount.balanceChange = Int64.fromUnsigned(liquidityAmount).negV2()
        await this.internal.burn({ address: sender, amount: liquidityAmount });

        // send mina to user
        await this.send({ to: sender, amount: amountMina });

        this.emitEvent("withdrawLiquidity", new WithdrawLiquidityEvent({ sender, amountMinaOut: amountMina, amountTokenOut, amountLiquidityIn: liquidityAmount }));

    }
}
