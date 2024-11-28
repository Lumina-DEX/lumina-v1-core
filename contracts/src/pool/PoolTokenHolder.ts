import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey, TokenId, Int64 } from 'o1js';
import { Pool, mulDiv, SwapEvent, PoolData, FungibleToken } from '../indexpool.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class PoolTokenHolder extends SmartContract {

    @state(PublicKey) token0 = State<PublicKey>();
    @state(PublicKey) token1 = State<PublicKey>();
    @state(PublicKey) poolData = State<PublicKey>();

    events = {
        swap: SwapEvent
    };

    async deploy() {
        await super.deploy();

        Bool(false).assertTrue("You can't directly deploy a token holder");
    }

    // swap from mina to this token through the pool
    @method async swapFromMina(frontend: PublicKey, taxFeeFrontend: UInt64, amountMinaIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64
    ) {
        const protocol = await this.swap(frontend, taxFeeFrontend, amountMinaIn, amountTokenOutMin, balanceInMax, balanceOutMin, true);
        let pool = new Pool(this.address);
        await pool.swapMinaForToken(protocol, amountMinaIn, balanceInMax);
    }


    // swap from mina to this token through the pool
    @method async swapFromToken(frontend: PublicKey, taxFeeFrontend: UInt64, amountTokenIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64
    ) {
        await this.swap(frontend, taxFeeFrontend, amountTokenIn, amountTokenOutMin, balanceInMax, balanceOutMin, false);
    }

    // check if they are no exploit possible  
    @method async withdrawLiquidity(liquidityAmount: UInt64, amountMinaMin: UInt64, amountTokenMin: UInt64, reserveMinaMin: UInt64, reserveTokenMin: UInt64, supplyMax: UInt64) {
        const amountToken = this.withdraw(liquidityAmount, amountTokenMin, reserveTokenMin, supplyMax);
        const pool = new Pool(this.address);
        await pool.withdrawLiquidity(liquidityAmount, amountMinaMin, amountToken, reserveMinaMin, supplyMax);
    }

    // check if they are no exploit possible  
    @method async withdrawLiquidityToken(liquidityAmount: UInt64, amountToken0Min: UInt64, amountToken1Min: UInt64, reserveToken0Min: UInt64, reserveToken1Min: UInt64, supplyMax: UInt64) {
        const [token0, token1] = this.checkToken(false);

        // check if token match
        const tokenId0 = TokenId.derive(token0);
        this.tokenId.assertEquals(tokenId0, "Call this method from PoolHolderAccount for token 0");
        const fungibleToken1 = new FungibleToken(token1);

        // withdraw token 0
        const amountToken = this.withdraw(liquidityAmount, amountToken0Min, reserveToken0Min, supplyMax);

        let poolTokenZ = new PoolTokenHolder(this.address, fungibleToken1.deriveTokenId());
        await poolTokenZ.subWithdrawLiquidity(liquidityAmount, amountToken0Min, amountToken, reserveToken0Min, reserveToken1Min, supplyMax);

        await fungibleToken1.approveAccountUpdate(poolTokenZ.self);
    }

    /**
    * Don't call this method directly, use withdrawLiquidityToken for token 0
    */
    @method async subWithdrawLiquidity(liquidityAmount: UInt64, amountToken0Min: UInt64, amountToken1Min: UInt64, reserveToken0Min: UInt64, reserveToken1Min: UInt64, supplyMax: UInt64) {
        // withdraw token 1
        const amountToken = this.withdraw(liquidityAmount, amountToken1Min, reserveToken1Min, supplyMax);

        let pool = new Pool(this.address);
        await pool.checkLiquidityToken(liquidityAmount, amountToken0Min, amountToken, reserveToken0Min, supplyMax);
    }

    private withdraw(liquidityAmount: UInt64, amountTokenMin: UInt64, reserveTokenMin: UInt64, supplyMax: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero");
        reserveTokenMin.assertGreaterThan(UInt64.zero, "Reserve token min can't be zero");
        amountTokenMin.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero");

        this.account.balance.requireBetween(reserveTokenMin, UInt64.MAXINT());

        // calculate amount token out
        const amountToken = mulDiv(liquidityAmount, reserveTokenMin, supplyMax);
        amountToken.assertGreaterThanOrEqual(amountTokenMin, "Insufficient amount token out");

        const sender = this.sender.getUnconstrainedV2();
        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountToken });
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        return amountToken;
    }

    private async swap(frontend: PublicKey, taxFeeFrontend: UInt64, amountTokenIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64, isMinaPool: boolean) {
        amountTokenIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountTokenOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountTokenOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves");
        taxFeeFrontend.assertLessThanOrEqual(Pool.maxFee, "Frontend fee exceed max fees");

        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        // check if token match
        const [token0, token1] = this.checkToken(isMinaPool);
        const tokenId0 = TokenId.derive(token0);
        const tokenId1 = TokenId.derive(token1);
        this.tokenId.equals(tokenId0).or(this.tokenId.equals(tokenId1)).assertTrue("Inccorect token id");

        const tokenIdIn = Provable.if(this.tokenId.equals(tokenId0), tokenId1, tokenId0);
        const tokenAddressIn = Provable.if(this.tokenId.equals(tokenId0), token1, token0);

        // calculate amount token out, No tax for the moment (probably in a next version),   
        let amountOutBeforeFee = mulDiv(balanceOutMin, amountTokenIn, balanceInMax.add(amountTokenIn));
        // 0.20% tax fee for liquidity provider directly on amount out
        const feeLP = mulDiv(amountOutBeforeFee, UInt64.from(2), UInt64.from(1000));
        // 0.15% fee max for the frontend
        const feeFrontend = mulDiv(amountOutBeforeFee, taxFeeFrontend, UInt64.from(10000));
        // 0.05% to the protocol  
        const feeProtocol = mulDiv(amountOutBeforeFee, UInt64.from(5), UInt64.from(10000));

        let amountOut = amountOutBeforeFee.sub(feeLP).sub(feeFrontend).sub(feeProtocol);
        amountOut.assertGreaterThanOrEqual(amountTokenOutMin, "Insufficient amount out");

        let sender = this.sender.getUnconstrainedV2();

        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountOut })
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
        // send fee to frontend (if not empty)
        const frontendReceiver = Provable.if(frontend.equals(PublicKey.empty()), this.address, frontend);
        let frontendUpdate = await this.send({ to: frontendReceiver, amount: feeFrontend });
        frontendUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        // send fee to protocol
        const poolDataAddress = this.poolData.getAndRequireEquals();
        const poolData = new PoolData(poolDataAddress);
        const protocol = await poolData.getProtocol();
        const protocolReceiver = Provable.if(protocol.equals(PublicKey.empty()), this.address, protocol);
        let protocolUpdate = await this.send({ to: protocolReceiver, amount: feeProtocol });
        protocolUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        if (!isMinaPool) {
            // transfer other token if is not a mina pool
            const otherPool = AccountUpdate.create(this.address, tokenIdIn);
            otherPool.account.balance.requireBetween(UInt64.one, balanceInMax);
            const tokenIn = new FungibleToken(tokenAddressIn);
            await tokenIn.approveAccountUpdate(otherPool);
            await tokenIn.transfer(sender, this.address, amountTokenIn);
        }

        this.emitEvent("swap", new SwapEvent({ sender, amountIn: amountTokenIn, amountOut }));

        return protocolReceiver;
    }

    private checkToken(isMinaPool: boolean) {
        const token0 = this.token0.getAndRequireEquals();
        const token1 = this.token1.getAndRequireEquals();
        // token 0 need to be empty on mina pool
        token0.equals(PublicKey.empty()).assertEquals(isMinaPool, isMinaPool ? "Not a mina pool" : "Invalid token 0 address");
        token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address");
        return [token0, token1];
    }

}
