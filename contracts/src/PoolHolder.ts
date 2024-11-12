import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey, TokenId, Int64 } from 'o1js';
import { Pool, mulDiv, SwapEvent, PoolData, FungibleToken } from './indexmina.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class PoolHolder extends SmartContract {

    @state(PublicKey) token0 = State<PublicKey>();
    @state(PublicKey) token1 = State<PublicKey>();
    @state(PublicKey) poolData = State<PublicKey>();

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
        const pool = new Pool(this.address);
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
        // if token 0 is empty so it's a Mina/Token pool
        this.token0.requireEquals(PublicKey.empty());

        amountMinaIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountTokenOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountTokenOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves");
        taxFeeFrontend.assertLessThanOrEqual(Pool.maxFee, "Frontend fee exceed max fees");

        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        // calculate amount token out, No tax for the moment (probably in a next version),   
        let amountOutBeforeFee = mulDiv(balanceOutMin, amountMinaIn, balanceInMax.add(amountMinaIn));
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
        const protocolReceiver = await this.getProtocolReceiver();
        let protocolUpdate = await this.send({ to: protocolReceiver, amount: feeProtocol });
        protocolUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        let pool = new Pool(this.address);
        await pool.swapFromMina(amountMinaIn, balanceInMax);

        this.emitEvent("swap", new SwapEvent({ sender, amountIn: amountMinaIn, amountOut }));
    }

    // swap from mina to this token through the pool
    @method async swapFromToken(frontend: PublicKey, taxFeeFrontend: UInt64, amountTokenIn: UInt64, amountTokenOutMin: UInt64, balanceInMax: UInt64, balanceOutMin: UInt64
    ) {
        amountTokenIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountTokenOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountTokenOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves");
        taxFeeFrontend.assertLessThanOrEqual(Pool.maxFee, "Frontend fee exceed max fees");

        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        // check if token match
        const token0Address = this.token0.getAndRequireEquals();
        const token1Address = this.token1.getAndRequireEquals();
        const tokenId0 = TokenId.derive(token0Address);
        const tokenId1 = TokenId.derive(token1Address);
        this.tokenId.equals(tokenId0).or(this.tokenId.equals(tokenId1)).assertTrue("Inccorect token id");

        const tokenIdIn = Provable.if(this.tokenId.equals(tokenId0), tokenId1, tokenId0);
        const tokenAddressIn = Provable.if(this.tokenId.equals(tokenId0), token1Address, token0Address);

        const otherPool = AccountUpdate.create(this.address, tokenIdIn);
        otherPool.account.balance.requireBetween(UInt64.one, balanceInMax);

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
        const protocolReceiver = await this.getProtocolReceiver();
        let protocolUpdate = await this.send({ to: protocolReceiver, amount: feeProtocol });
        protocolUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        const tokenIn = new FungibleToken(tokenAddressIn);
        await tokenIn.approveAccountUpdate(otherPool);
        await tokenIn.transfer(sender, this.address, amountTokenIn);

        this.emitEvent("swap", new SwapEvent({ sender, amountIn: amountTokenIn, amountOut }));
    }

    // check if they are no exploit possible  
    @method async withdrawLiquidity(liquidityAmount: UInt64, amountToken0Min: UInt64, amountToken1Min: UInt64, reserveToken0Min: UInt64, reserveToken1Min: UInt64, supplyMax: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero");
        reserveToken1Min.assertGreaterThan(UInt64.zero, "Reserve token min can't be zero");
        amountToken1Min.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero");

        // check if token match
        const token1Address = this.token1.getAndRequireEquals();
        const tokenId1 = TokenId.derive(token1Address);

        let poolTokenZ = new PoolHolder(this.address, tokenId1);

        this.account.balance.requireBetween(reserveToken0Min, UInt64.MAXINT());

        // calculate amount token out
        const amountToken = mulDiv(liquidityAmount, reserveToken0Min, supplyMax);
        amountToken.assertGreaterThanOrEqual(amountToken0Min, "Insufficient amount token out");

        const sender = this.sender.getUnconstrainedV2();
        // send token to the user
        let receiverUpdate = this.send({ to: sender, amount: amountToken });
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        await poolTokenZ.subWithdrawLiquidity(liquidityAmount, amountToken0Min, amountToken, reserveToken0Min, reserveToken1Min, supplyMax);

        const token1 = new FungibleToken(token1Address);
        await token1.approveAccountUpdate(poolTokenZ.self);

    }

    @method async subWithdrawLiquidity(liquidityAmount: UInt64, amountMinaMin: UInt64, amountTokenMin: UInt64, reserveMinaMin: UInt64, reserveTokenMin: UInt64, supplyMax: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero");
        reserveTokenMin.assertGreaterThan(UInt64.zero, "Reserve token min can't be zero");
        amountTokenMin.assertGreaterThan(UInt64.zero, "Amount token can't be zero");
        supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero");

        let pool = new Pool(this.address);

        this.account.balance.requireBetween(reserveMinaMin, UInt64.MAXINT());

        // calculate amount token out
        const amountToken = mulDiv(liquidityAmount, reserveMinaMin, supplyMax);
        amountToken.assertGreaterThanOrEqual(amountMinaMin, "Insufficient amount token out");

        const sender = this.sender.getUnconstrainedV2();
        // send token to the user

        let receiverUpdate = this.send({ to: sender, amount: amountToken });
        receiverUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

        // const token1Address = this.token1.getAndRequireEquals();
        // const token = new FungibleToken(token1Address);
        // this.self.balanceChange = Int64.fromUnsigned(amountToken).negV2();
        // const senderAccount = AccountUpdate.create(sender, token.deriveTokenId());
        // senderAccount.balanceChange = Int64.fromUnsigned(amountToken);

        // await token.approveAccountUpdates([this.self, senderAccount]);

        await pool.checkLiquidity(liquidityAmount, amountMinaMin, amountToken, reserveMinaMin, supplyMax);
    }

    private async getProtocolReceiver(): Promise<PublicKey> {
        const poolDataAddress = this.poolData.getAndRequireEquals();
        const poolData = new PoolData(poolDataAddress);
        const protocol = await poolData.getProtocol();
        const protocolReceiver = Provable.if(protocol.equals(PublicKey.empty()), this.address, protocol);
        return protocolReceiver;
    }

}
