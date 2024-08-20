import { Field, SmartContract, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, Bool, TransactionVersion, TokenId } from 'o1js';
import { TokenStandard, MinaTokenHolder, mulDiv } from './indexmina.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    token: PublicKey;
}


/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolAccount extends TokenContractV2 {
    // we need the token address to instantiate it
    @state(PublicKey) token = State<PublicKey>();
    @state(UInt64) reserveToken = State<UInt64>();
    @state(UInt64) reserveMina = State<UInt64>();
    @state(UInt64) liquiditySupply = State<UInt64>();

    async deploy(args: PoolMinaDeployProps) {
        await super.deploy(args);
        args.token.isEmpty().assertFalse("token empty");
        this.token.set(args.token);

        this.reserveToken.set(UInt64.zero);
        this.reserveMina.set(UInt64.zero);

        this.account.permissions.set({
            ...Permissions.default(),
            setVerificationKey: Permissions.VerificationKey.proofOrSignature()
        });

        // lumina dex liquidity
        this.account.tokenSymbol.set("LDL");
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }


    @method async deployAccount() {
        const sender = this.sender.getUnconstrained();
        // let token = new TokenStandard(address);

        const update = AccountUpdate.createSigned(this.address, this.deriveTokenId());

        const provedState = update.account.provedState.getAndRequireEquals();
        provedState.assertEquals(Bool(false), "Already initialised");

        update.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: {
                    auth: Permissions.impossible(),
                    txnVersion: TransactionVersion.current()
                },
            },
        };

        // we use only the 2 first field to store token balance
        update.body.update.appState = [
            { isSome: Bool(true), value: UInt64.zero.value },
            { isSome: Bool(true), value: UInt64.zero.value },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
        ];

        await this.approveAccountUpdate(update);
    }

    /**
     * Upgrade to a new version
     * @param verificationKey new verification key
     */
    @method async upgrade(verificationKey: VerificationKey) {
        this.account.verificationKey.set(verificationKey);
    }

    @method async supplyFirstLiquidities(amountToken: UInt64, amountMina: UInt64) {
        const liquidity = this.liquiditySupply.getAndRequireEquals();
        liquidity.equals(UInt64.zero).assertTrue("First liquidities already supplied");

        amountToken.assertGreaterThan(UInt64.zero, "No amount A supplied");
        amountMina.assertGreaterThan(UInt64.zero, "No amount Mina supplied");
        const liquidityAmount = amountToken.add(amountMina);

        // https://docs.openzeppelin.com/contracts/4.x/erc4626#inflation-attack, check if necessary in our case
        liquidityAmount.assertGreaterThan(minimunLiquidity, "Insufficient amount to mint liquidities");

        let tokenContract = new TokenStandard(this.token.getAndRequireEquals());

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getAndRequireSignature();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await tokenContract.transfer(sender, this.address, amountToken);
        await senderUpdate.send({ to: this, amount: amountMina });

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB - minimal liquidity, todo check overflow  
        // => maintains ratio a/l, b/l       
        const liquidityUser = liquidityAmount.sub(minimunLiquidity);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityUser });

        // set default informations
        this.reserveToken.set(amountToken);
        this.reserveMina.set(amountMina);
        this.liquiditySupply.set(liquidityAmount);
    }

    @method async supplyLiquidityFromTokenA(amountToken: UInt64, maxAmountMina: UInt64) {
        amountToken.assertGreaterThan(UInt64.zero, "No token amount supplied");

        let tokenContract = new TokenStandard(this.token.getAndRequireEquals());

        const balanceToken = this.reserveToken.getAndRequireEquals();
        const balanceMina = this.reserveMina.getAndRequireEquals();

        // amount Y to supply
        const amountMina = mulDiv(amountToken, balanceMina, balanceToken);

        amountMina.assertGreaterThan(UInt64.zero, "No Mina amount to supply");
        amountMina.assertLessThanOrEqual(maxAmountMina, "Mina amount greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await tokenContract.transfer(sender, this.address, amountToken);
        await senderUpdate.send({ to: this.address, amount: amountMina });

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountToken.add(amountMina);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        this.reserveMina.set(balanceMina.add(amountMina));
        this.reserveToken.set(balanceToken.add(amountToken));
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
    }

    @method async supplyLiquidityFromMina(amountMina: UInt64, maxAmountToken: UInt64) {
        amountMina.assertGreaterThan(UInt64.zero, "No Mina amount supplied");

        let tokenContract = new TokenStandard(this.token.getAndRequireEquals());

        const balanceToken = this.reserveToken.getAndRequireEquals();
        const balanceMina = this.reserveMina.getAndRequireEquals();

        // amount Y to supply
        const amountToken = mulDiv(amountMina, balanceToken, balanceMina);

        amountToken.assertGreaterThan(UInt64.zero, "No token amount to supply");
        amountToken.assertLessThanOrEqual(maxAmountToken, "Token Amount greater than desired amount");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getUnconstrained();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await tokenContract.transfer(sender, this.address, amountToken);
        await senderUpdate.send({ to: this.address, amount: amountMina });

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountToken.add(amountMina);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        this.reserveMina.set(balanceMina.add(amountMina));
        this.reserveToken.set(balanceToken.add(amountToken));
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
    }

    @method async swapFromMina(amountIn: UInt64, amountOutMin: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

        const balanceToken = this.reserveToken.getAndRequireEquals();
        const balanceMina = this.reserveMina.getAndRequireEquals();

        // we request token out because this is the token holder who update his balance to transfer out
        let tokenContractOut = new TokenStandard(this.token.getAndRequireEquals());
        let tokenHolderOut = new MinaTokenHolder(this.address, tokenContractOut.deriveTokenId());


        // transfer In before transfer out        
        let sender = this.sender.getUnconstrained();
        let accountUser = AccountUpdate.createSigned(sender);

        // transfer token in to this pool
        await accountUser.send({ to: this, amount: amountIn });
        // calculate correct amount out to transfer the token out
        const amountOut = await tokenHolderOut.swap(amountIn, amountOutMin);

        //await accountUser.send({ to: this, amount: amountIn });
        await tokenContractOut.transfer(tokenHolderOut.self, sender, amountOut);

        // set new supply
        this.reserveMina.set(balanceMina.add(amountIn));
        this.reserveToken.set(balanceToken.sub(amountOut));
    }

    @method async swapFromToken(amountIn: UInt64, amountOutMin: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

        const tokenContract = new TokenStandard(this.token.getAndRequireEquals());

        const reserveIn = this.reserveToken.getAndRequireEquals();
        const reserveOut = this.reserveMina.getAndRequireEquals();

        reserveIn.assertGreaterThan(amountIn, "Insufficient reserve in");

        let amountOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        reserveOut.assertGreaterThan(amountOut, "Insufficient reserve out");

        let sender = this.sender.getUnconstrained();

        // send token A to contract
        await tokenContract.transfer(sender, this.address, amountIn);
        // send mina to user
        await this.send({ to: sender, amount: amountOut });

        // set new supply
        this.reserveToken.set(reserveIn.add(amountIn));
        this.reserveMina.set(reserveOut.sub(amountOut));
    }

}
