import { AccountUpdate, Bool, method, Provable, PublicKey, SmartContract, state, State, Struct, TokenId, UInt32, UInt64, VerificationKey } from 'o1js';
import { FungibleToken, mulDiv, Pool, PoolFactory, SwapEvent, UpdateVerificationKeyEvent } from '../indexpool.js';
import { checkToken, IPool } from './IPoolState.js';
import { Multisig, UpgradeInfo } from './Multisig.js';

/**
 * Event emitted when an user withdraw liquidity
 */
export class WithdrawLiquidityEvent extends Struct({
    sender: PublicKey,
    amountLiquidityIn: UInt64,
    amountToken0Out: UInt64,
    amountToken1Out: UInt64,
}) {
    constructor(value: {
        sender: PublicKey,
        amountLiquidityIn: UInt64,
        amountToken0Out: UInt64,
        amountToken1Out: UInt64,
    }) {
        super(value);
    }
}

/**
 * Event emitted when liquidity was withdrawn on the second pool token holder contract
 */
export class SubWithdrawLiquidityEvent extends Struct({
    sender: PublicKey,
    amountLiquidityIn: UInt64,
    amountTokenOut: UInt64,
}) {
    constructor(value: {
        sender: PublicKey,
        amountLiquidityIn: UInt64,
        amountTokenOut: UInt64,
    }) {
        super(value);
    }
}

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class PoolTokenHolder extends SmartContract implements IPool {
    /**
      * Address of first token in the pool (ordered by address)
      * PublicKey.empty() in case of native mina
      */
    @state(PublicKey)
    token0 = State<PublicKey>()
    /**
     * Address of second token in the pool
     * Can't be empty
     */
    @state(PublicKey)
    token1 = State<PublicKey>()
    /**
     * Pool factory contract address
     */
    @state(PublicKey)
    poolFactory = State<PublicKey>()

    /**
     * List of pool token holder events
     */
    events = {
        withdrawLiquidity: WithdrawLiquidityEvent,
        swap: SwapEvent,
        upgrade: UpdateVerificationKeyEvent,
        subWithdrawLiquidity: SubWithdrawLiquidityEvent
    };

    /**
     * This method can't be called directly, deploy new pool token holder from pool factory
     */
    async deploy() {
        await super.deploy();
        Bool(false).assertTrue("You can't directly deploy a token holder");
    }

    /**
     * Upgrade to a new version, necessary due to o1js breaking verification key compatibility between versions
     */
    @method async updateVerificationKey() {
        const factoryAddress = this.poolFactory.getAndRequireEquals();
        const factory = new PoolFactory(factoryAddress);
        const vk = await factory.getPoolTokenHolderVK();

        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash));
    }

    /**
     * Swap from mina to token
     * @param frontend address who collect the frontend fees
     * @param taxFeeFrontend fees applied by the frontend
     * @param amountMinaIn amount of mina to swap
     * @param amountTokenOutMin minimum token to received
     * @param balanceInMax minimum balance of mina in the pool
     * @param balanceOutMin maximum balance of token in the pool
     */
    @method async swapFromMinaToToken(frontend: PublicKey, taxFeeFrontend: UInt64, amountMinaIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64
    ) {
        const pool = new Pool(this.address);
        // we check the protocol in the pool
        const protocol = pool.protocol.get();
        const sender = this.sender.getUnconstrained();
        await this.swap(sender, protocol, frontend, taxFeeFrontend, amountMinaIn, amountTokenOutMin, balanceInMax, balanceOutMin, true);
        await pool.swapFromMinaToToken(sender, protocol, amountMinaIn, balanceInMax);
    }

    /**
     * Swap from token to another token
     * @param frontend address who collect the frontend fees
     * @param taxFeeFrontend fees applied by the frontend
     * @param amountTokenIn amount of tokenIn to swap
     * @param amountTokenOutMin minimum tokenOut to received
     * @param balanceInMax minimum balance of tokenIn in the pool
     * @param balanceOutMin maximum balance of tokenOut in the pool
     */
    @method async swapFromTokenToToken(frontend: PublicKey, taxFeeFrontend: UInt64, amountTokenIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64
    ) {
        const pool = new Pool(this.address);
        // we check the protocol in the pool
        const protocol = pool.protocol.get();
        const sender = this.sender.getUnconstrained();
        await this.swap(sender, protocol, frontend, taxFeeFrontend, amountTokenIn, amountTokenOutMin, balanceInMax, balanceOutMin, false);
    }

    /**
     * Withdraw liquidity from the mina/token pool
     * The reserves min and supply max permit concurrent call, use slippage mechanism to calculate it
     * @param liquidityAmount amount of liquidity to withdraw
     * @param amountMinaMin minimum amount of mina to receive
     * @param amountTokenMin minimum amount of token to receive
     * @param reserveMinaMin reserve min of mina in the pool
     * @param reserveTokenMin reserve min of token in the pool
     * @param supplyMax maximum liquidity in the pool
     */
    @method async withdrawLiquidity(liquidityAmount: UInt64, amountMinaMin: UInt64, amountTokenMin: UInt64, reserveMinaMin: UInt64, reserveTokenMin: UInt64, supplyMax: UInt64) {
        const sender = this.sender.getUnconstrained();
        const amountToken = this.withdraw(sender, liquidityAmount, amountTokenMin, reserveTokenMin, supplyMax);
        const pool = new Pool(this.address);
        const amountMina = await pool.withdrawLiquidity(sender, liquidityAmount, amountMinaMin, reserveMinaMin, supplyMax);
        this.emitEvent("withdrawLiquidity", new WithdrawLiquidityEvent({ sender, amountToken0Out: amountMina, amountToken1Out: amountToken, amountLiquidityIn: liquidityAmount }));
    }

    /**
     * Withdraw liquidity from the token/token pool
     * The reserves min and supply max permit concurrent call, use slippage mechanism to calculate it
     * @param liquidityAmount amount of liquidity to withdraw
     * @param amountMinaMin minimum amount of mina to receive
     * @param amountTokenMin minimum amount of token to receive
     * @param reserveMinaMin reserve min of mina in the pool
     * @param reserveTokenMin reserve min of token in the pool
     * @param supplyMax maximum liquidity in the pool
     */
    @method async withdrawLiquidityToken(liquidityAmount: UInt64, amountToken0Min: UInt64, amountToken1Min: UInt64, reserveToken0Min: UInt64, reserveToken1Min: UInt64, supplyMax: UInt64) {
        const [token0, token1] = checkToken(this, false);

        // check if token match
        const tokenId0 = TokenId.derive(token0);
        this.tokenId.assertEquals(tokenId0, "Call this method from PoolHolderAccount for token 0");
        const fungibleToken1 = new FungibleToken(token1);

        const sender = this.sender.getUnconstrained();
        // withdraw token 0
        const amountToken = this.withdraw(sender, liquidityAmount, amountToken0Min, reserveToken0Min, supplyMax);

        let poolTokenZ = new PoolTokenHolder(this.address, fungibleToken1.deriveTokenId());

        const amountToken1 = await poolTokenZ.subWithdrawLiquidity(sender, liquidityAmount, amountToken, reserveToken1Min, supplyMax);
        await fungibleToken1.approveAccountUpdate(poolTokenZ.self);
        this.emitEvent("withdrawLiquidity", new WithdrawLiquidityEvent({ sender, amountToken0Out: amountToken, amountToken1Out: amountToken1, amountLiquidityIn: liquidityAmount }));
    }

    /**
     * Don't call this method directly, use withdrawLiquidityToken for token 0
     */
    @method.returns(UInt64) async subWithdrawLiquidity(sender: PublicKey, liquidityAmount: UInt64, amountToken1Min: UInt64, reserveToken1Min: UInt64, supplyMax: UInt64) {
        const methodSender = this.sender.getUnconstrained();
        methodSender.assertEquals(sender);
        // withdraw token 1
        const amountToken = this.withdraw(sender, liquidityAmount, amountToken1Min, reserveToken1Min, supplyMax);
        let pool = new Pool(this.address);
        await pool.burnLiquidityToken(sender, liquidityAmount, supplyMax);
        // we emit an event in case of the user call this method directly
        this.emitEvent("subWithdrawLiquidity", new SubWithdrawLiquidityEvent({ sender, amountTokenOut: amountToken, amountLiquidityIn: liquidityAmount }));

        return amountToken;
    }

    private withdraw(sender: PublicKey, liquidityAmount: UInt64, amountTokenMin: UInt64, reserveTokenMin: UInt64, supplyMax: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero");
        reserveTokenMin.assertGreaterThan(UInt64.zero, "Reserve token min can't be zero");
        amountTokenMin.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero");

        this.account.balance.requireBetween(reserveTokenMin, UInt64.MAXINT());

        // calculate amount token out
        const amountToken = mulDiv(liquidityAmount, reserveTokenMin, supplyMax);
        amountToken.assertGreaterThanOrEqual(amountTokenMin, "Insufficient amount token out");

        // send token to the user
        const receiverAccount = AccountUpdate.createSigned(sender, this.tokenId);
        let receiverUpdate = this.send({ to: receiverAccount, amount: amountToken });
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        return amountToken;
    }

    private async swap(sender: PublicKey, protocol: PublicKey, frontend: PublicKey, taxFeeFrontend: UInt64, amountTokenIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64, isMinaPool: boolean) {
        amountTokenIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountTokenOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountTokenOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves");
        taxFeeFrontend.assertLessThanOrEqual(Pool.maxFee, "Frontend fee exceed max fees");

        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        // check if token match
        const [token0, token1] = checkToken(this, isMinaPool);
        const tokenId0 = TokenId.derive(token0);
        const tokenId1 = TokenId.derive(token1);
        this.tokenId.equals(tokenId0).or(this.tokenId.equals(tokenId1)).assertTrue("Incorrect token id");

        const tokenIdIn = Provable.if(this.tokenId.equals(tokenId0), tokenId1, tokenId0);
        const tokenAddressIn = Provable.if(this.tokenId.equals(tokenId0), token1, token0);

        const { feeFrontend, feeProtocol, amountOut } = Pool.getAmountOut(taxFeeFrontend, amountTokenIn, balanceInMax, balanceOutMin);

        amountOut.assertGreaterThanOrEqual(amountTokenOutMin, "Insufficient amount out");

        // send token to the user
        const receiverAccount = AccountUpdate.createSigned(sender, this.tokenId);
        let receiverUpdate = this.send({ to: receiverAccount, amount: amountOut })
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
        // send fee to frontend (if not empty)
        const frontendReceiver = Provable.if(frontend.equals(PublicKey.empty()), this.address, frontend);
        let frontendUpdate = await this.send({ to: frontendReceiver, amount: feeFrontend });
        frontendUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        // send fee to protocol  
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
    }

}