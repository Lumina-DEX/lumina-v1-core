import { Field, SmartContract, Struct, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, Int64, Poseidon, Bool, Experimental, SelfProof, ZkProgram, MerkleWitness, MerkleTree } from 'o1js';
import { TokenStandard } from './index.js';
import { Withdraw } from './Withdraw.js';


export class Leaf extends Struct({
    id: UInt64,
    owner: PublicKey,
    token: PublicKey,
    tokenPair: PublicKey,
    amount: UInt64,
    parentId: UInt64,
    childId: UInt64,
    // Deposit, swap In, swap Out, withdraw, mint, burn ...
    actionType: UInt64,
    newBalance: UInt64,
    idDeposit: UInt64,
    idWithdraw: UInt64,
    isTokenPair: Bool
}) {
    constructor(value: {
        id: UInt64,
        owner: PublicKey,
        tokenPair: PublicKey,
        token: PublicKey,
        amount: UInt64,
        parentId: UInt64,
        childId: UInt64,
        // Deposit, swap, withdraw, mint, burn ...
        actionType: UInt64,
        newBalance: UInt64,
        idDeposit: UInt64,
        idWithdraw: UInt64,
        isTokenPair: Bool,
        signatureOwner: Field
    }) {
        super(value);
    }

    hash(): Field {
        return Poseidon.hash([
            new Field(this.id.value),
            this.owner.x,
            this.owner.isOdd.toField(),
            this.token.x,
            this.token.isOdd.toField(),
            this.tokenPair.x,
            this.tokenPair.isOdd.toField(),
            new Field(this.amount.value),
            new Field(this.parentId.value),
            new Field(this.childId.value),
            new Field(this.actionType.value),
            new Field(this.newBalance.value),
            new Field(this.idDeposit.value),
            new Field(this.idWithdraw.value),
            new Field(this.isTokenPair.value)
        ]);
    }
}

// create a new tree
const height = 32;
const tree = new MerkleTree(height);
class MerkleWitness32 extends MerkleWitness(height) { }

export class ProvedMerkle extends Struct({
    initialMerkle: Field,
    previousMerkle: Field,
    newMerkle: Field
}) {
    constructor(value: {
        initialMerkle: Field,
        previousMerkle: Field,
        newMerkle: Field
    }) {
        super(value);
    }

    hash(): Field {
        return Poseidon.hash([
            this.initialMerkle,
            this.previousMerkle,
            this.newMerkle
        ]);
    }
}



export const RollupProof = ZkProgram({
    name: 'add-example',
    publicOutput: ProvedMerkle,

    methods: {
        addLeaf: {
            privateInputs: [SelfProof, Leaf, Leaf, MerkleWitness32, MerkleWitness32],
            async method(oldProof: SelfProof<ProvedMerkle, void>, previousLeaf: Leaf, newLeaf: Leaf, previousWitness: MerkleWitness32, newWitness: MerkleWitness32) {

                const rootBefore = previousWitness.calculateRoot(previousLeaf.hash());
                rootBefore.assertEquals(oldProof.publicInput.initialMerkle);

                return oldProof.publicInput;
            },
        },
    },
});


/**
 * Pool contract for Lumina dex
 */
export class Rollup extends SmartContract {

    @state(Field) oldRoot = State<Field>();
    @state(Field) newRoot = State<Field>();

    init() {
        super.init();

        this.oldRoot.set(Field(0));
        this.newRoot.set(Field(0));
    }

    @method async setRoot(newRoot: Field) {
        const actualRoot = this.newRoot.getAndRequireEquals();
        this.oldRoot.set(actualRoot);
        this.newRoot.set(newRoot);
    }

}
