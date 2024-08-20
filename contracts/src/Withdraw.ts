import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, Bool, assert } from 'o1js';
import { TokenStandard } from './index.js';


/**
 * Pool contract for Lumina dex
 */
export class Withdraw extends SmartContract {

    @state(UInt64) lastNonce = State<UInt64>();

    init() {
        super.init();
    }

    @method.returns(Bool) async addProof(hashProof: string, nonce: UInt64, tokenA: PublicKey, tokenB: PublicKey, amountA: UInt64, amountB: UInt64, receiver: PublicKey) {

        // check proof
        let actualNonce = this.lastNonce.getAndRequireEquals();
        let expectedNonce = actualNonce.add(1);

        expectedNonce.equals(nonce).assertTrue("Incorrect proof");

        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;

        this.lastNonce.set(expectedNonce);

        return Bool(true);
    }

}
