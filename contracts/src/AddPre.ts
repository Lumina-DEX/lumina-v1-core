import { Field, SmartContract, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey } from 'o1js';
import { FungibleToken, MinaTokenHolder, mulDiv } from './indexmina.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    token: PublicKey;
}


/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class AddPre extends SmartContract {

    @state(UInt64) liquiditySupply = State<UInt64>();

    @method async firstAddMina(amountMina: UInt64) {
        const liquidity = this.liquiditySupply.getAndRequireEquals();
        liquidity.assertLessThan(amountMina);

        liquidity.assertEquals(UInt64.zero);

        amountMina.assertGreaterThan(UInt64.zero, "No amount Mina supplied");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getAndRequireSignature();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await senderUpdate.send({ to: this, amount: amountMina });

        // set default informations
        this.liquiditySupply.set(liquidity.add(amountMina));
    }


    @method async addMina(amountMina: UInt64) {
        const liquidity = this.liquiditySupply.getAndRequireEquals();
        liquidity.assertLessThan(amountMina);
        liquidity.assertGreaterThan(UInt64.from(1));

        amountMina.assertGreaterThan(UInt64.zero, "No amount Mina supplied");

        // require signature on transfer, so don't need to request it now
        let sender = this.sender.getAndRequireSignature();
        let senderUpdate = AccountUpdate.createSigned(sender);

        await senderUpdate.send({ to: this, amount: amountMina });



        // set default informations
        this.liquiditySupply.set(liquidity.add(amountMina));
    }




}
