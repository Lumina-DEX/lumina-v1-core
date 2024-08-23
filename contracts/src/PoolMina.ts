import { Field, SmartContract, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account } from 'o1js';
import { FungibleToken, MinaTokenHolder, mulDiv } from './indexmina.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    token: PublicKey;
}


/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolMina extends SmartContract {
    // we need the token address to instantiate it
    @state(PublicKey) token = State<PublicKey>();
    @state(UInt64) liquiditySupply = State<UInt64>();

    async deploy(args: PoolMinaDeployProps) {
        await super.deploy(args);
        args.token.isEmpty().assertFalse("token empty");
        this.token.set(args.token);

        this.account.permissions.set({
            ...Permissions.default(),
            setVerificationKey: Permissions.VerificationKey.proofOrSignature()
        });
    }

    /**
     * Upgrade to a new version
     * @param verificationKey new verification key
     */
    @method async updgrade(verificationKey: VerificationKey) {
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

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getAndRequireSignature();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await tokenContract.transfer(sender, this.address, amountToken);
        await senderUpdate.send({ to: this, amount: amountMina });

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB - minimal liquidity, todo check overflow  
        // => maintains ratio a/l, b/l       
        const liquidityUser = liquidityAmount.sub(minimunLiquidity);
        // mint token
        this.mint(this.self, sender, liquidityUser);

        // set default informations
        this.liquiditySupply.set(liquidityAmount);
    }

    mint(from: AccountUpdate, to: PublicKey, amount: UInt64): AccountUpdate {
        let id = TokenId.derive(from.publicKey, from.tokenId);
        let receiver = AccountUpdate.default(to, id);
        receiver.balance.addInPlace(amount);
        receiver.label = `token.mint()`;
        from.approve(receiver);
        return receiver;
    }


    @method async supplyLiquidityFromTokenA(amountToken: UInt64, maxAmountMina: UInt64) {
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

        await tokenContract.transfer(sender, this.address, amountToken);
        await senderUpdate.send({ to: this.address, amount: amountMina });

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountToken.add(amountMina);
        // mint token
        // this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
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

        await tokenContract.transfer(sender, this.address, amountToken);
        await senderUpdate.send({ to: this.address, amount: amountMina });

        const actualSupply = this.liquiditySupply.getAndRequireEquals();

        // calculate liquidity token output simply as liquidityAmount = amountA + amountB 
        // => maintains ratio a/l, b/l
        let liquidityAmount = amountToken.add(amountMina);
        // mint token
        //this.internal.mint({ address: sender, amount: liquidityAmount });

        // set new supply      
        this.liquiditySupply.set(actualSupply.add(liquidityAmount));
    }

    @method async swapFromMina(amountIn: UInt64, amountOutMin: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

        // we request token out because this is the token holder who update his balance to transfer out
        let tokenContractOut = new FungibleToken(this.token.getAndRequireEquals());
        let tokenHolderOut = new MinaTokenHolder(this.address, tokenContractOut.deriveTokenId());

        // transfer In before transfer out        
        let sender = this.sender.getUnconstrained();
        let accountUser = AccountUpdate.createSigned(sender);

        // transfer token in to this pool
        await accountUser.send({ to: this, amount: amountIn });
        // calculate correct amount out to transfer the token out
        const amountOut = await tokenHolderOut.swap(amountIn, amountOutMin);

        //await accountUser.send({ to: this, amount: amountIn });
        await tokenContractOut.transfer(tokenHolderOut.address, sender, amountOut);

    }

    @method async swapFromToken(amountIn: UInt64, amountOutMin: UInt64) {
        amountIn.assertGreaterThan(UInt64.zero, "No amount in supplied");
        amountOutMin.assertGreaterThan(UInt64.zero, "No amount out supplied");

        let tokenContract = new FungibleToken(this.token.getAndRequireEquals());
        let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId());

        const balanceToken = tokenAccount.account.balance.getAndRequireEquals();
        const balanceMina = this.account.balance.getAndRequireEquals();

        balanceToken.assertGreaterThan(amountIn, "Insufficient reserve in");

        let amountOut = mulDiv(balanceMina, amountIn, balanceToken.add(amountIn));
        amountOut.assertGreaterThanOrEqual(amountOutMin, "Insufficient amout out");

        balanceToken.assertGreaterThan(amountOut, "Insufficient reserve out");

        let sender = this.sender.getUnconstrained();

        // send token A to contract
        await tokenContract.transfer(sender, this.address, amountIn);
        // send mina to user
        await this.send({ to: sender, amount: amountOut });

    }

}
