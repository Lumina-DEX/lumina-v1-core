import { Field, SmartContract, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct } from 'o1js';
import { FungibleToken, MinaTokenHolder, mulDiv } from './indexmina.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

export class depositiInfo extends Struct({
    owner: PublicKey,
    amount: UInt64
}) {
    constructor(value: {
        owner: PublicKey,
        amount: UInt64
    }) {
        super(value);
    }
}

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    token: PublicKey;
}


/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolMina extends TokenContractV2 {
    // we need the token address to instantiate it
    @state(PublicKey) token = State<PublicKey>();

    async deploy(args: PoolMinaDeployProps) {
        await super.deploy(args);
        args.token.isEmpty().assertFalse("Token empty");
        this.token.set(args.token);

        this.account.permissions.set({
            ...Permissions.default(),
            send: Permissions.proof(),
            setVerificationKey: Permissions.VerificationKey.proofOrSignature()
        });
    }

    @method
    async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    /**
     * Upgrade to a new version
     * @param verificationKey new verification key
     */
    @method async upgrade(verificationKey: VerificationKey) {
        this.account.verificationKey.set(verificationKey);
    }


    @method async supplyFirstLiquidities(amountToken: UInt64, amountMina: UInt64) {
        const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId());
        const balanceLiquidity = circulationUpdate.account.balance.getAndRequireEquals();
        balanceLiquidity.equals(UInt64.zero).assertTrue("First liquidities already supplied");

        amountToken.assertGreaterThan(UInt64.zero, "No token amount supplied");
        amountMina.assertGreaterThan(UInt64.zero, "No mina amount supplied");
        const liquidityAmount = amountToken.add(amountMina);

        // https://docs.openzeppelin.com/contracts/4.x/erc4626#inflation-attack, check if necessary in our case
        liquidityAmount.assertGreaterThan(minimunLiquidity, "Insufficient amount to mint liquidities");

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        // send mina to the pool
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);
        senderUpdate.send({ to: this.self, amount: amountMina });

        // send token to the pool
        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        senderToken.send({ to: tokenAccount, amount: amountToken });

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB - minimal liquidity, todo check overflow  
        // => maintains ratio a/l, b/l       
        const liquidityUser = liquidityAmount.sub(minimunLiquidity);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityUser });
        this.internal.mint({ address: circulationUpdate, amount: liquidityAmount });

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);
    }

    @method async supplyLiquidity(amountMina: UInt64, amountToken: UInt64, reserveMinaMax: UInt64, reserveTokenMax: UInt64, supplyMin: UInt64) {
        amountMina.assertGreaterThan(UInt64.zero, "Amount Mina can't be zero");
        amountToken.assertGreaterThan(UInt64.zero, "Amount Token can't be zero");
        reserveTokenMax.assertGreaterThan(UInt64.zero, "Reserve Token max can't be zero");
        reserveMinaMax.assertGreaterThan(UInt64.zero, "Reserve Mina max can't be zero");
        supplyMin.assertGreaterThan(UInt64.zero, "Supply mi, can't be zero");

        const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId());
        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        tokenAccount.account.balance.requireBetween(UInt64.one, reserveTokenMax);
        this.account.balance.requireBetween(UInt64.one, reserveMinaMax);
        circulationUpdate.account.balance.requireBetween(supplyMin, UInt64.MAXINT());

        // calculate liquidity token output simply as amountX * liquiditySupply / reserveX 
        const liquidityMina = mulDiv(amountMina, supplyMin, reserveMinaMax);
        const liquidityToken = mulDiv(amountToken, supplyMin, reserveTokenMax);
        liquidityMina.equals(liquidityToken).assertTrue("Incorrect amount of token");

        // send mina to the pool
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);
        senderUpdate.send({ to: this.self, amount: amountMina });

        // send token to the pool
        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        senderToken.send({ to: tokenAccount, amount: amountToken });

        // mint token
        this.internal.mint({ address: sender, amount: liquidityMina });
        this.internal.mint({ address: circulationUpdate, amount: liquidityMina });

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);
    }

    @method async swapFromToken(amountIn: UInt64, amountOutExpected: UInt64, balanceOutMin: UInt64, balanceInMax: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero");
        balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");
        amountOutExpected.assertGreaterThan(UInt64.zero, "Amount out can't be zero");
        amountOutExpected.assertLessThan(balanceOutMin, "Amount out exceeds reserves");

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        tokenAccount.account.balance.requireBetween(UInt64.one, balanceInMax);
        this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT());

        let amountOut = mulDiv(balanceOutMin, amountIn, balanceInMax.add(amountIn));
        amountOut.equals(amountOutExpected).assertTrue("Incorrect amount out calculation");

        // send token to the pool
        let sender = this.sender.getUnconstrained();
        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        senderToken.send({ to: tokenAccount, amount: amountIn });

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);

        // send mina to user
        await this.send({ to: sender, amount: amountOut });

    }

    @method async withdrawLiquidity(liquidityAmount: UInt64, reserveMinaMin: UInt64, supplyMax: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero");
        reserveMinaMin.assertGreaterThan(UInt64.zero, "Reserve mina min can't be zero");
        supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero");

        this.account.balance.requireBetween(reserveMinaMin, UInt64.MAXINT());

        const sender = this.sender.getUnconstrained();

        const liquidityAccount = AccountUpdate.create(this.address, this.deriveTokenId());
        liquidityAccount.account.balance.requireBetween(UInt64.one, supplyMax);

        const amountMina = mulDiv(liquidityAmount, reserveMinaMin, supplyMax);

        // burn liquidity from user and current supply
        await this.internal.burn({ address: liquidityAccount, amount: liquidityAmount });
        await this.internal.burn({ address: sender, amount: liquidityAmount });

        // send mina to user
        await this.send({ to: sender, amount: amountMina });
    }
}
