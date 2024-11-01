import { Field, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct, CircuitString, assert, Types, SmartContract } from 'o1js';
import { BalanceChangeEvent, FungibleToken, mulDiv, Pool, PoolData, PoolHolder } from './indexmina.js';

/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolLiquidity extends SmartContract {
    @state(PublicKey) pool = State<PublicKey>();
    @state(UInt64) token0Amount = State<UInt64>();

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

    private async match() {
        const pool = this.pool.getAndRequireEquals();
        const poolTokenId = TokenId.derive(pool);
        const sender = this.sender.getAndRequireSignatureV2();
        this.address.assertEquals(sender);
        this.tokenId.assertEquals(poolTokenId);
    }

    /**
    * Upgrade to a new version
    * @param vk new verification key
    */
    @method async updateVerificationKey(vk: VerificationKey) {
        const poolAddress = this.pool.getAndRequireEquals();
        const pool = new Pool(poolAddress);
        const poolDataAddress = await pool.getPoolData();
        const poolData = new PoolData(poolDataAddress);
        const owner = await poolData.getOwner();

        // only owner can update a pool
        AccountUpdate.createSigned(owner);

        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }


    @method async clearLiquidity(amountToken0: UInt64) {
        const amount = this.token0Amount.getAndRequireEquals();
        amount.assertGreaterThanOrEqual(amountToken0, "Insuffisient amount deposited");
        const newAmount = amount.sub(amountToken0);
        this.token0Amount.set(newAmount);
    }

    @method async addLiquidity(amountToken: UInt64) {
        const poolAddress = this.pool.getAndRequireEquals();
        const pool = new Pool(poolAddress);
        const tokenAddress = await pool.getToken0();
        const amount = this.token0Amount.getAndRequireEquals();
        tokenAddress.equals(PublicKey.empty()).assertFalse("You can't call this method on mina pool");

        let tokenContract = new FungibleToken(tokenAddress);
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());
        let sender = this.sender.getUnconstrainedV2();
        sender.equals(this.address).assertFalse("Can't transfer to/from the pool account");

        // send token to the pool
        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        senderToken.send({ to: tokenAccount, amount: amountToken });
        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);

        const newAmount = amount.add(amountToken);
        this.token0Amount.set(newAmount);
    }


}
