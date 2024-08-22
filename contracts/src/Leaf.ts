import { Field, SmartContract, Struct, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, Int64, Poseidon, Bool, Experimental, SelfProof, ZkProgram, MerkleWitness, MerkleTree, MerkleMapWitness } from 'o1js';



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
    owner: PublicKey,
    token: PublicKey,
    nonce: UInt64,
    isWithdraw: Bool,
    amount: UInt64
}) {
    constructor(value: {
        owner: PublicKey,
        token: PublicKey,
        nonce: UInt64,
        isWithdraw: Bool,
        amount: UInt64
    }) {
        super(value);
    }

    key(): Field {
        return Poseidon.hash([
            this.owner.x,
            this.owner.isOdd.toField(),
            this.nonce.value,
            new Field(this.isWithdraw.value)
        ]);
    }

    hash(): Field {
        return Poseidon.hash([
            this.owner.x,
            this.owner.isOdd.toField(),
            this.token.x,
            this.token.isOdd.toField(),
            new Field(this.nonce.value),
            new Field(this.isWithdraw.value),
            new Field(this.amount.value)
        ]);
    }
}


export class SwapLeaf extends Struct({
    owner: PublicKey,
    tokenIn: PublicKey,
    tokenOut: PublicKey,
    timestamp: UInt64,
    deadline: UInt64,
    amountIn: UInt64,
    minAmountOut: UInt64,
    signature: Field
}) {
    constructor(value: {
        owner: PublicKey,
        tokenIn: PublicKey,
        tokenOut: PublicKey,
        timestamp: UInt64,
        deadline: UInt64,
        amountIn: UInt64,
        minAmountOut: UInt64,
        signature: Field
    }) {
        super(value);
    }

    key(): Field {
        return this.signature;
    }


    hash(): Field {
        return Poseidon.hash([
            this.owner.x,
            this.owner.isOdd.toField(),
            this.tokenIn.x,
            this.tokenIn.isOdd.toField(),
            this.tokenOut.x,
            this.tokenOut.isOdd.toField(),
            new Field(this.timestamp.value),
            new Field(this.deadline.value),
            new Field(this.amountIn.value),
            new Field(this.minAmountOut.value)
        ]);
    }
}
