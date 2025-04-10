import { AccountUpdate, Bool, Field, method, Provable, PublicKey, Signature, SmartContract, state, State, Struct, TokenId, UInt64, VerificationKey } from 'o1js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class MultisigProof extends SmartContract {
    @state(Field) approvedSigner = State<Field>();
    @state(Field) approvedUpdate = State<Field>();
    @state(UInt64) minSignature = State<UInt64>();


    @method.returns(Bool)
    async canUpdate(signature1: Signature, signature2: Signature, signature3: Signature) {

        return Bool(false);
    }
}