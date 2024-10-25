import { Field, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct, CircuitString, assert, Types, SmartContract } from 'o1js';
import { BalanceChangeEvent, FungibleToken, mulDiv, PoolData, PoolHolder } from './indexmina.js';

/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolLiquidity extends SmartContract {
    // we need the token address to instantiate it
    @state(PublicKey) token0 = State<PublicKey>();
    @state(PublicKey) token1 = State<PublicKey>();
    @state(PublicKey) poolData = State<PublicKey>();
    @state(Field) depositHash0 = State<Field>();
    @state(Field) depositHash1 = State<Field>();

    // max fee for frontend 0.15 %
    static maxFee: UInt64 = UInt64.from(15);
    static minimunLiquidity: UInt64 = UInt64.from(1000);

    events = {
        upgrade: Field
    };

    async deploy() {
        await super.deploy();

        Bool(false).assertTrue("You can't directly deploy a pool");
    }

    /**
    * Upgrade to a new version
    * @param vk new verification key
    */
    @method async updateVerificationKey(vk: VerificationKey) {
        const poolDataAddress = this.poolData.getAndRequireEquals();
        const poolData = new PoolData(poolDataAddress);
        const owner = await poolData.getOwner();

        // only owner can update a pool
        AccountUpdate.createSigned(owner);

        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }


    @method.returns(UInt64) async addLiquidity(amountToken0: UInt64, amountToken1: UInt64) {
        amountToken0.assertGreaterThan(UInt64.zero, "Amount token 0 can't be zero");
        amountToken1.assertGreaterThan(UInt64.zero, "Amount token 1 can't be zero");

        // if token 0 is empty so it's a Mina/Token pool
        const token0 = this.token0.getAndRequireEquals();
        const token1 = this.token1.getAndRequireEquals();
        Provable.log("token0", token0);
        Provable.log("token1", token1);
        token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address");

        // if token 0 is empty we send mina to the pool
        const amountMina = Provable.if(token0.equals(PublicKey.empty()), amountToken0, UInt64.zero);
        //await this.sendMina(amountMina);

        // if token 0 is not empty we send fungible token to the pool
        const amount0 = Provable.if(token0.equals(PublicKey.empty()), UInt64.zero, amountToken0);
        await this.sendToken(token0, amount0);
        // send token 1
        await this.sendToken(token1, amountToken1);

        Provable.log("token sent");

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        //const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId());
        this.account.balance.requireEquals(UInt64.zero);

        const liquidityAmount = amount0.add(amountToken1);
        // on first mint remove minimal liquidity amount to prevent from inflation attack
        const liquidityUser = liquidityAmount.sub(PoolLiquidity.minimunLiquidity);
        // mint token       
        let sender = this.sender.getUnconstrainedV2();
        //this.internal.mint({ address: sender, amount: liquidityUser });
        this.balance.addInPlace(liquidityAmount);

        //this.emitEvent("addLiquidity", new AddLiquidityEvent({ sender, amountMinaIn: amountToken0, amountTokenIn: amountToken1, amountLiquidityOut: liquidityUser }));

        return liquidityAmount;
    }




    @method.returns(PublicKey) async getPoolData() {
        const poolData = this.poolData.getAndRequireEquals();
        return poolData;
    }

    private async sendToken(tokenAddress: PublicKey, amount: UInt64) {
        let tokenContract = new FungibleToken(tokenAddress);
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());
        let sender = this.sender.getUnconstrainedV2();
        sender.equals(this.address).assertFalse("Can't transfer to/from the pool account");

        // send token to the pool
        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        senderToken.send({ to: tokenAccount, amount: amount });
        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);
    }

    private async sendMina(amount: UInt64) {
        let sender = this.sender.getUnconstrainedV2();
        sender.equals(this.address).assertFalse("Can't transfer to/from the pool account");
        let senderUpdate = AccountUpdate.createSigned(sender);
        senderUpdate.send({ to: this.self, amount: amount });
    }
}
