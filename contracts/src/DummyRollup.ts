import { Field, SmartContract, Struct, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, Int64, Poseidon, Bool, Experimental, SelfProof, ZkProgram, MerkleWitness, MerkleTree, MerkleMapWitness } from 'o1js';
import { TokenStandard } from './index.js';
import { Withdraw } from './Withdraw.js';
import { add } from 'o1js/dist/node/lib/provable/gadgets/native-curve.js';


export class UserLeaf extends Struct({
    owner: PublicKey,
    token: PublicKey,
    balance: UInt64
}) {
    constructor(value: {
        owner: PublicKey,
        token: PublicKey,
        balance: UInt64
    }) {
        super(value);
    }

    key(): Field {
        return Poseidon.hash([
            this.owner.x,
            this.owner.isOdd.toField(),
            this.token.x,
            this.token.isOdd.toField()
        ]);
    }

    hash(): Field {
        return Poseidon.hash([
            this.owner.x,
            this.owner.isOdd.toField(),
            this.token.x,
            this.token.isOdd.toField(),
            new Field(this.balance.value)
        ]);
    }
}

export class PairLeaf extends Struct({
    pair: PublicKey,
    tokenA: PublicKey,
    tokenB: PublicKey,
    reserveA: UInt64,
    reserveB: UInt64,
    totalLiquidity: UInt64
}) {
    constructor(value: {
        pair: PublicKey,
        tokenA: PublicKey,
        tokenB: PublicKey,
        reserveA: UInt64,
        reserveB: UInt64,
        totalLiquidity: UInt64
    }) {
        super(value);
    }

    key(): Field {
        return Poseidon.hash([
            this.pair.x,
            this.pair.isOdd.toField()
        ]);
    }

    pairKey(): PublicKey {
        return PublicKey.fromFields(this.tokenA.toFields().concat(this.tokenB.toFields()));
    }

    hash(): Field {
        return Poseidon.hash([
            this.pair.x,
            this.pair.isOdd.toField(),
            this.tokenA.x,
            this.tokenA.isOdd.toField(),
            this.tokenB.x,
            this.tokenB.isOdd.toField(),
            new Field(this.reserveA.value),
            new Field(this.reserveB.value),
            new Field(this.totalLiquidity.value)
        ]);
    }
}

export class DepositLeaf extends Struct({
    pair: PublicKey,
    tokenA: PublicKey,
    tokenB: PublicKey,
    reserveA: UInt64,
    reserveB: UInt64,
    totalLiquidity: UInt64
}) {
    constructor(value: {
        pair: PublicKey,
        tokenA: PublicKey,
        tokenB: PublicKey,
        reserveA: UInt64,
        reserveB: UInt64,
        totalLiquidity: UInt64
    }) {
        super(value);
    }

    key(): Field {
        return Poseidon.hash([
            this.pair.x,
            this.pair.isOdd.toField()
        ]);
    }

    pairKey(): PublicKey {
        return PublicKey.fromFields(this.tokenA.toFields().concat(this.tokenB.toFields()));
    }

    hash(): Field {
        return Poseidon.hash([
            this.pair.x,
            this.pair.isOdd.toField(),
            this.tokenA.x,
            this.tokenA.isOdd.toField(),
            this.tokenB.x,
            this.tokenB.isOdd.toField(),
            new Field(this.reserveA.value),
            new Field(this.reserveB.value),
            new Field(this.totalLiquidity.value)
        ]);
    }
}

export class Leaf extends Struct({
    id: UInt64,
    owner: PublicKey,
    token: PublicKey,
    tokenPair: PublicKey,
    amount: UInt64,
    minAmountOut: UInt64,
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
        minAmountOut: UInt64,
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
            new Field(this.minAmountOut.value),
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

export class DepositLeafList extends Struct({
    Leaf1: Leaf,
    Leaf2: Leaf,
    Leaf3: Leaf,
    Leaf4: Leaf,
    Leaf5: Leaf,
    Leaf6: Leaf,
    Leaf7: Leaf,
    Leaf8: Leaf,
    Leaf9: Leaf,
    Leaf10: Leaf,
}) {
    constructor(value: {
        Leaf1: Leaf,
        Leaf2: Leaf,
        Leaf3: Leaf,
        Leaf4: Leaf,
        Leaf5: Leaf,
        Leaf6: Leaf,
        Leaf7: Leaf,
        Leaf8: Leaf,
        Leaf9: Leaf,
        Leaf10: Leaf,
    }) {
        super(value);
    }

    hash(): Field {
        return Poseidon.hash([
            this.Leaf1.hash(),
            this.Leaf2.hash(),
            this.Leaf3.hash(),
            this.Leaf4.hash(),
            this.Leaf5.hash(),
            this.Leaf6.hash(),
            this.Leaf7.hash(),
            this.Leaf8.hash(),
            this.Leaf9.hash(),
            this.Leaf10.hash(),
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
    newMerkle: Field,
    deposits: DepositLeafList
}) {
    constructor(value: {
        initialMerkle: Field,
        previousMerkle: Field,
        newMerkle: Field,
        deposits: DepositLeafList
    }) {
        super(value);
    }

    hash(): Field {
        return Poseidon.hash([
            this.initialMerkle,
            this.previousMerkle,
            this.newMerkle,
            this.deposits.hash()
        ]);
    }
}



export const RollupProof = ZkProgram({
    name: 'add-example',
    publicOutput: ProvedMerkle,

    methods: {
        deposit: {
            privateInputs: [SelfProof, Leaf, Leaf, MerkleMapWitness, MerkleMapWitness],
            async method(oldProof: SelfProof<ProvedMerkle, void>, balanceLeaf: Leaf, newLeaf: Leaf, previousWitness: MerkleMapWitness, newWitness: MerkleMapWitness) {
                const [rootBefore, key] = previousWitness.computeRootAndKeyV2(balanceLeaf.hash());
                rootBefore.assertEquals(oldProof.publicInput.initialMerkle);

                oldProof.publicInput.previousMerkle = oldProof.publicInput.newMerkle;
                oldProof.publicInput.newMerkle = rootBefore;

                return oldProof.publicInput;
            },
        },
        withdraw: {
            privateInputs: [SelfProof, Leaf, Leaf, MerkleMapWitness, MerkleMapWitness],
            async method(oldProof: SelfProof<ProvedMerkle, void>, previousLeaf: Leaf, newLeaf: Leaf, previousWitness: MerkleMapWitness, newWitness: MerkleMapWitness) {

                const [rootBefore, key] = previousWitness.computeRootAndKeyV2(previousLeaf.hash());
                rootBefore.assertEquals(oldProof.publicInput.initialMerkle);

                return oldProof.publicInput;
            },
        },
        swap: {
            privateInputs: [SelfProof, Leaf, Leaf, MerkleMapWitness, MerkleMapWitness],
            async method(oldProof: SelfProof<ProvedMerkle, void>, previousLeaf: Leaf, newLeaf: Leaf, previousWitness: MerkleMapWitness, newWitness: MerkleMapWitness) {

                const [rootBefore, key] = previousWitness.computeRootAndKeyV2(previousLeaf.hash());
                rootBefore.assertEquals(oldProof.publicInput.initialMerkle);

                return oldProof.publicInput;
            },
        },
        addLiquidity: {
            privateInputs: [SelfProof, Leaf, Leaf, MerkleMapWitness, MerkleMapWitness],
            async method(oldProof: SelfProof<ProvedMerkle, void>, previousLeaf: Leaf, newLeaf: Leaf, previousWitness: MerkleMapWitness, newWitness: MerkleMapWitness) {

                const [rootBefore, key] = previousWitness.computeRootAndKeyV2(previousLeaf.hash());
                rootBefore.assertEquals(oldProof.publicInput.initialMerkle);

                return oldProof.publicInput;
            },
        },
        removeLiquidity: {
            privateInputs: [SelfProof, Leaf, Leaf, MerkleMapWitness, MerkleMapWitness],
            async method(oldProof: SelfProof<ProvedMerkle, void>, previousLeaf: Leaf, newLeaf: Leaf, previousWitness: MerkleMapWitness, newWitness: MerkleMapWitness) {

                const [rootBefore, key] = previousWitness.computeRootAndKeyV2(previousLeaf.hash());
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
