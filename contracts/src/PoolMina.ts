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

    reducer = Reducer({ actionType: depositiInfo });

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

        amountToken.assertGreaterThan(UInt64.zero, "No amount A supplied");
        amountMina.assertGreaterThan(UInt64.zero, "No amount Mina supplied");
        const liquidityAmount = amountToken.add(amountMina);

        // https://docs.openzeppelin.com/contracts/4.x/erc4626#inflation-attack, check if necessary in our case
        liquidityAmount.assertGreaterThan(minimunLiquidity, "Insufficient amount to mint liquidities");

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        // create custom account update to optimize the number of account update
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);

        senderUpdate.balance.subInPlace(amountMina);
        this.self.balance.addInPlace(amountMina);

        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        //await tokenContract.transfer(senderUpdate.publicKey, this.address, amountToken);
        senderToken.balance.subInPlace(amountToken);
        tokenAccount.balance.addInPlace(amountToken);

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB - minimal liquidity, todo check overflow  
        // => maintains ratio a/l, b/l       
        const liquidityUser = liquidityAmount.sub(minimunLiquidity);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityUser });

        // keep circulation supply info to calculate next liquidity add/remove
        circulationUpdate.balanceChange = Int64.fromUnsigned(liquidityAmount);

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);
    }


    @method async supplyLiquidityFromToken(amountToken: UInt64, maxAmountMina: UInt64) {
        amountToken.assertGreaterThan(UInt64.zero, "No token amount supplied");

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        const balanceToken = tokenAccount.account.balance.getAndRequireEquals();
        const balanceMina = this.account.balance.getAndRequireEquals();

        // amount Y to supply
        const amountMina = mulDiv(amountToken, balanceMina, balanceToken);

        amountMina.assertGreaterThan(UInt64.zero, "No Mina amount to supply");
        amountMina.assertLessThanOrEqual(maxAmountMina, "Mina amount greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);

        senderUpdate.balance.subInPlace(amountMina);
        this.self.balance.addInPlace(amountMina);

        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        //await tokenContract.transfer(senderUpdate.publicKey, this.address, amountToken);
        senderToken.balance.subInPlace(amountToken);
        tokenAccount.balance.addInPlace(amountToken);

        const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId())

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountToken.add(amountMina);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        circulationUpdate.balanceChange = Int64.fromUnsigned(liquidityAmount);

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);
    }

    @method async supplyLiquidityFromMina(amountMina: UInt64, maxAmountToken: UInt64) {
        amountMina.assertGreaterThan(UInt64.zero, "No Mina amount supplied");

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        const balanceToken = tokenAccount.account.balance.getAndRequireEquals();
        const balanceMina = this.account.balance.getAndRequireEquals();

        // amount Y to supply
        const amountToken = mulDiv(amountMina, balanceToken, balanceMina);

        amountToken.assertGreaterThan(UInt64.zero, "No token amount to supply");
        amountToken.assertLessThanOrEqual(maxAmountToken, "Token Amount greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);

        senderUpdate.balance.subInPlace(amountMina);
        this.self.balance.addInPlace(amountMina);

        let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());
        //await tokenContract.transfer(senderUpdate.publicKey, this.address, amountToken);
        senderToken.balance.subInPlace(amountToken);
        tokenAccount.balance.addInPlace(amountToken);

        const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId())

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountToken.add(amountMina);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply      
        circulationUpdate.balanceChange = Int64.fromUnsigned(liquidityAmount);

        await tokenContract.approveAccountUpdates([senderToken, tokenAccount]);
    }

    @method async swapFromMina(amountIn: UInt64, amountOutMin: UInt64, balanceMin: UInt64, balanceMax: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

        // we request token out because this is the token holder who update his balance to transfer out
        let tokenContractOut = new FungibleToken(this.token.getAndRequireEquals());
        let tokenHolderOut = new MinaTokenHolder(this.address, tokenContractOut.deriveTokenId());

        // calculate correct amount out to transfer the token out
        const amountOut = await tokenHolderOut.swap(amountIn, amountOutMin, balanceMin, balanceMax);

        // transfer In before transfer out        
        let sender = this.sender.getUnconstrained();

        const userAccount = AccountUpdate.create(sender, tokenContractOut.deriveTokenId());
        userAccount.balance.addInPlace(amountOut);

        await tokenContractOut.approveAccountUpdates([tokenHolderOut.self, userAccount]);
    }

    @method async swapFromToken(amountIn: UInt64, amountOutMin: UInt64, balanceMin: UInt64, balanceMax: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        balanceMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero");
        balanceMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero");

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        tokenAccount.account.balance.requireBetween(UInt64.one, balanceMax);
        this.account.balance.requireBetween(balanceMin, UInt64.MAXINT());

        balanceMin.assertGreaterThan(amountIn, "Insufficient reserve in");

        let amountOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        let sender = this.sender.getUnconstrained();
        let usertokenAccount = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId());

        // send token from user to contract
        usertokenAccount.balance.subInPlace(amountIn);
        tokenAccount.balance.addInPlace(amountIn);

        await tokenContract.approveAccountUpdates([usertokenAccount, tokenAccount]);

        // send mina to user
        await this.send({ to: sender, amount: amountOut });

    }

    @method async depositLiquidity(liquidityAmount: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "No amount supplied");

        const sender = this.sender.getUnconstrained();

        // burn liquidity from sender and store it
        await this.internal.burn({ address: sender, amount: liquidityAmount });

        const depositInfo: depositiInfo = new depositiInfo({ owner: sender, amount: liquidityAmount });
        this.reducer.dispatch(depositInfo);
    }

    // @method async withdraw() {
    //     const sender = this.sender.getUnconstrained();

    //     let actions = this.reducer.getActions();
    //     const action = this.reducer.reduce()

    //     // burn liquidity from sender and store it
    //     await this.internal.burn({ address: sender, amount: liquidityAmount });

    //     const depositInfo: depositiInfo = new depositiInfo({ owner: sender, amount: liquidityAmount });
    //     this.reducer.dispatch(depositInfo);
    // }

    @method async withdrawLiquidity(liquidityAmount: UInt64) {
        liquidityAmount.assertGreaterThan(UInt64.zero, "No amount supplied");

        const balanceMina = this.account.balance.getAndRequireEquals();

        // we request token out because this is the token holder who update his balance to transfer out
        let tokenContractOut = new FungibleToken(this.token.getAndRequireEquals());
        let tokenHolderOut = new MinaTokenHolder(this.address, tokenContractOut.deriveTokenId());

        const sender = this.sender.getUnconstrained();

        const liquidityAccount = AccountUpdate.create(this.address, this.deriveTokenId());
        const totalSupply = liquidityAccount.account.balance.getAndRequireEquals();

        const amountMina = mulDiv(liquidityAmount, balanceMina, totalSupply);
        await tokenHolderOut.moveAmount(UInt64.from(10000));

        const userAccount = AccountUpdate.create(sender, tokenContractOut.deriveTokenId());
        userAccount.balance.addInPlace(10000);

        await tokenContractOut.approveAccountUpdates([tokenHolderOut.self, userAccount]);

        // burn liquidity from user and current supply
        //  await this.internal.burn({ address: this.address, amount: liquidityAmount });
        //await this.internal.burn({ address: sender, amount: liquidityAmount });

        // send mina to user
        await this.send({ to: sender, amount: amountMina });
    }

    @method
    async burnLiquidity(user: PublicKey, dl: UInt64) {
        // this makes sure there is enough l to burn (user balance stays >= 0), so l stays >= 0, so l was >0 before
        this.internal.burn({ address: user, amount: dl });

    }

    /**
 * Helper for `DexTokenHolder.redeemFinalize()` which adds preconditions on
 * the current action state and token supply
 */
    @method async redeemLiquidityFinalize(
        actionState: Field,
        totalSupply: UInt64,
        fromActionState: Field
    ) {
        this.account.actionState.requireEquals(actionState);

        const liquidityAccount = AccountUpdate.create(this.address, this.deriveTokenId());
        liquidityAccount.account.balance.requireEquals(totalSupply);

        let actions = this.reducer.getActions();
        let balanceMina = this.account.balance.getAndRequireEquals();

        this.reducer.forEach(
            actions,
            ({ owner, amount }) => {
                // for every user that redeemed liquidity, we calculate the token output
                // and create a child account update which pays the user
                const amountToken = mulDiv(amount, balanceMina, totalSupply);
                let receiver = this.send({ to: owner, amount: amountToken });
                // note: this should just work when the reducer gives us dummy data

                // important: these child account updates inherit token permission from us
                receiver.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;

                // burn liquidity from circulation supply
                this.internal.burn({ address: liquidityAccount, amount: amount });
            },
            {
                maxUpdatesWithActions: MinaTokenHolder.redeemActionBatchSize,
                // DEX contract doesn't allow setting preconditions from outside (= w/o proof)
                skipActionStatePrecondition: true,
            }
        );


    }

}
