import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable } from 'o1js';
import { TokenStandard } from './index.js';
import { Withdraw } from './Withdraw.js';


/**
 * Pool contract for Lumina dex
 */
export class Deposit extends SmartContract {
    @state(PublicKey) approvedKey = State<PublicKey>();


    init() {
        super.init();
    }

    @method async deposit(tokenA: PublicKey, tokenB: PublicKey, amountA: UInt64, amountB: UInt64) {

        let tokenContractA = new TokenStandard(tokenA);
        let tokenContractB = new TokenStandard(tokenA);

        const sender = this.sender.getUnconstrained();

        await tokenContractA.transfer(this.sender.getUnconstrained(), this.address, amountA);
        await tokenContractB.transfer(this.sender.getUnconstrained(), this.address, amountB);
    }

    @method async withdraw(hashProof: string, nonce: UInt64, tokenA: PublicKey, tokenB: PublicKey, amountA: UInt64, amountB: UInt64, receiver: PublicKey) {

        let tokenContractA = new TokenStandard(tokenA);
        let tokenContractB = new TokenStandard(tokenA);

        const sender = this.sender.getAndRequireSignature();

        let senderContract = new TokenStandard(sender);

        let withdrawContractSender = new Withdraw(this.address, senderContract.deriveTokenId());
        // withdrawContractSender.addProof()

        await tokenContractA.transfer(this.self, receiver, amountA);
        await tokenContractB.transfer(this.self, receiver, amountB);
    }

}
