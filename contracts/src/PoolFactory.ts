import { Field, SmartContract, state, Permissions, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Poseidon, VerificationKey, Reducer, Account, assert, fetchAccount, MerkleList, TransactionVersion, TokenContractV2, DeployArgs, TokenId, CircuitString } from 'o1js';
import { FungibleToken, PoolData, PoolMina, PoolTokenHolder } from './indexmina.js';


export const contractData = "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";
export const contractHash = Field("27869273158675798351694849109960400575836124893377122482851082053344555026095");
export const contractHolderData = "AADnPH7zPue347Wo3oNt/8b3xHU8uVKkn5XNRRDPiY/KH7I1DN1b2gilH6Y4yyPwl6mp23vZt9MFl+QMJQBTvcAahS9xkBcfxRTAAMBHXhf8KDkK39AalVocKIrfWMV0MSShinj0bCxPCc10K0cya4Voy8fud4+hktDOuwjaAstpEJSbKRHMIki77xHmJWlFUYdkgPg30MU4Ta3ev/h+mcMWmofyhLSQqUbaV6hM95n3Y0Wcn2LRNxJP8TRwHndIcylleqPsGMh3P+A+N9c32N4kl29nreMJJdcUrCXK90GLPAFOB9mHIjKk9+9o3eZc3cGQ+jppXoN3zwO91DeT/GYvXqCZTAudLxIwuJU11UBThG5CKKABa9ulQ1bYGXj9Eydy0vPxfojDeFrnKMi9GKSjiSMzmOLbIw7Dt+g9ggjsHOKm4039zdOyAgYVvlUxrsxWoHR4L0925Cxcu8aWyQs2GTmVl73Fasa9dYaNrIkW0VZsPGp1l8+jAdEvbsPXrT+qFXBtHaN45PMWCyBx0TKaozETCmv0kA5KGTzesYQCECPQ8F2DM+oXz8xly+z9/Ypt/Zx9NvF7wute/1s6Q/QuAFinL+7D2Jo2ghA6CJeZa+MGNTgx9pnSOXvadgz9U5859rF48Mb1ASKLpsR6qZQEGgWb+tU9Z7F9JJ9Oich00SuualxBHmDFBY3jj2ar6dP2OIfn7prilChVTkVooq8LAzjcuUVNl/dxWgt+lNKIpiBegEFHA4Xr0XI0orQZjCIBEBXWMCQE5kfK476bQgrLeKJfQ45PZfgB688DGwaYAxWbcxBV822/aAsA55ijFY1Xf7S+DiytY4a/u0bellKMDUQqTOq9VwmbDv868zXscUwKpNVR3wy2En/q9M/HJJc4BZyuuQvlQSR59m0gL4hKHf5Dci/YVvM6ACHmg+5SxCr1pUNKbyy2lsIa5Ma40ZmsTpT4/lQczmGENQSQXA9bFibT0Q+Vj885p9heLOCCXyAujC4DhAdYmT1MQ7v4IxckiTexGN2y+iVDrIrpXimUxXHAri1B2jz4k2xR4JX9bxFEGfecOP9q4tJx9KxlZWbUEC+5AwK7mqEzv1ZeV7CcFMT4JZWZ3mAxOjSbNz4sBoXjLT+ruwazvzmEo1k9naIy3Oa3mEjUo24vTOUDw8rpupmvnlOYi/ZuJIFH1GtsHgj6l24QrqQAp0ebGEbpXqv21bhlr6dYBsculE2VU9SuGJ2g6yuuKf4+lfJ2V5TkIxFvlgw5cxTXNQ010JYug38++ZDV+MibXPzg+cODE5wfZ3jon5wVNkAiG642DzXzNj67x80zBWLdt3UKnFZs9dpa1fYpTjlJg8T+dnJJiKf2IvmvF8xyi1HAwAFyhDL2dn/w/pDE2Kl9QdpZpQYDEBQgCCkegsZszQ+2mjxU9pLXzz5GSoqz8jABW5Qo3abBAhvYKKaAs6NoRgeAD6SadFDbQmXaftE+Y1MVOtjnaZDUBdwahWiJMlkfZpxW1aubEc/GSX8WzCZ8h9HeakcRc7kcN0CR8kmfER3eiZ2JMbt5cQl/afNjwGGAmeXzTaR34AgFjiw/RlZJkhYm9jyf18M8yP94QGBMxd6Y6wrNvOmJHzEnp8aitJsDlZklm8LKbjumlSbLcbBokpIDhFBBKfwP2qsQX7eHLCZ/3mztoFKoIiYXgrHWG8m2SzIJ/ljn6Rg7AxIsPjzZyEw1eXAOC7A1FCT/757ygMsnk+rLlpDTBYLmhJtQdt61MQFDi5BuCmQ/PY9C/74/k4APl5htiNcCZty/1JElFwjuCQFjvAiMPUMyqp7/ALFapsTZqhSs1g6jd8uhuJoTNEqLDvKUUbs0kMvGy8BOG0YXNxmNccabGwBzxmijv6LF/Xinecl4aD8FCh6opY98TJnOHd3XSYL1DbLqmmc6CXEM+g5iDGnXr/CkI2Jy37OkF8X03jz4AH0Yj0+J63yH4IS+PrNpKZEXKh7PvXNaLGGKsFcKEi63/xKPKH0G4RzvFKbkp+IWqtIYjMiwIJMwzmfS1NLLXqqpFiD364eFcXINR2rrDKcoTUp1JkVZVfXfKwaRUPWSGFYIYMtwPh2w8ZfubAmXZFpyzstORhFyg9rtVAAy0lcDhQwWVlhFFkR2qbdoy0EFLBrfKqUIkd1N6vDQQYL1RGaTAv/ybregrJsFo+VP3ZatlR6LnKYWp1m7vPkGm3I6Pus/mvp1k10QGk8nhFuR31DjsG3lzZ4gXSs1oSv0qbxD2S6g5+Y6cPbITEGX3uQjsunXnQ9PHd22Mk+fqbDakTiCJh6aFqqPNShiAXkGSuC1oXJHX3zqnbn75dWO0UVhBNAbjYkSnQeyka1wnZb12sR+PlRMvWQVcd93t5L/FiE0ORo=";
export const contractHolderHash = Field("100256026807092237802505900034423214154714674118890126680283461605332538867");

export interface PoolMinaDeployProps extends Exclude<DeployArgs, undefined> {
    symbol: string;
    src: string;
    poolData: PublicKey;
}

export class PoolCreationEvent extends Struct({
    sender: PublicKey,
    poolAddress: PublicKey,
    tokenAddress: PublicKey
}) {
    constructor(value: {
        sender: PublicKey,
        poolAddress: PublicKey,
        tokenAddress: PublicKey
    }) {
        super(value);
    }
}


/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContractV2 {

    @state(PublicKey) poolData = State<PublicKey>();

    events = {
        poolAdded: PoolCreationEvent,
        upgrade: Field
    };

    async deploy(args: PoolMinaDeployProps) {
        await super.deploy(args);
        args.poolData.isEmpty().assertFalse("Pool data empty");

        this.account.zkappUri.set(args.src);
        this.account.tokenSymbol.set(args.symbol);
        this.poolData.set(args.poolData);

        let permissions = Permissions.default();
        permissions.access = Permissions.proofOrSignature();
        permissions.setPermissions = Permissions.impossible();
        permissions.setVerificationKey = Permissions.VerificationKey.proofOrSignature();
        this.account.permissions.set(permissions);
    }

    /**
     * Upgrade to a new version
     * @param vk new verification key
     */
    @method async updateVerificationKey(vk: VerificationKey) {
        const poolDataAddress = this.poolData.getAndRequireEquals();
        const poolData = new PoolData(poolDataAddress);
        const currentHash = poolData.poolHash.getAndRequireEquals();

        vk.hash.assertEquals(currentHash, "Incorrect verification key");

        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }

    @method
    async approveBase(forest: AccountUpdateForest) {
        forest.isEmpty().assertTrue("You can't approve any token operation");
    }

    /**
     * Create a new pool
     * @param newAccount address of the new pool
     * @param token for which the pool is created
     */
    @method
    async createPool(newAccount: PublicKey, token: PublicKey) {
        token.isEmpty().assertFalse("Token is empty");

        const fungibleToken = new FungibleToken(token);

        let tokenAccount = AccountUpdate.create(token, this.deriveTokenId());
        // if the balance is not zero, so a pool already exist for this token
        tokenAccount.account.balance.requireEquals(UInt64.zero);

        // create a pool as this new address
        const poolAccount = AccountUpdate.createSigned(newAccount);
        // Require this account didn't already exist
        poolAccount.account.isNew.requireEquals(Bool(true));

        // set pool account vk and permission
        poolAccount.body.update.verificationKey = { isSome: Bool(true), value: { data: contractData, hash: contractHash } };
        poolAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                // only proof to prevent signature owner to steal liquidity
                access: Permissions.proof(),
                setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
                send: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };

        // set poolAccount initial state
        let tokenFields = token.toFields();
        let poolDataAddress = this.poolData.getAndRequireEquals();
        let poolDataFields = poolDataAddress.toFields();

        poolAccount.body.update.appState = [
            { isSome: Bool(true), value: tokenFields[0] },
            { isSome: Bool(true), value: tokenFields[1] },
            { isSome: Bool(true), value: poolDataFields[0] },
            { isSome: Bool(true), value: poolDataFields[1] },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
            { isSome: Bool(true), value: Field(0) },
        ];


        // Liquidity token default name
        poolAccount.account.tokenSymbol.set("LUM");

        // create a token holder as this new address
        const poolHolderAccount = AccountUpdate.createSigned(newAccount, fungibleToken.deriveTokenId());
        // Require this account didn't already exist
        poolHolderAccount.account.isNew.requireEquals(Bool(true));

        // set pool token holder account vk and permission
        poolHolderAccount.body.update.verificationKey = { isSome: Bool(true), value: { data: contractHolderData, hash: contractHolderHash } };
        poolHolderAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
                send: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };


        // create a liquidity token holder as this new address
        const tokenId = TokenId.derive(newAccount);
        const liquidityAccount = AccountUpdate.createSigned(newAccount, tokenId);
        // Require this account didn't already exist
        liquidityAccount.account.isNew.requireEquals(Bool(true));
        liquidityAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
                // This is necessary in order to allow burn circulation supply without signature
                send: Permissions.none(),
                setPermissions: Permissions.impossible()
            },
        };

        // we mint one token to check if this pool exist 
        this.internal.mint({ address: tokenAccount, amount: UInt64.one });

        await fungibleToken.approveAccountUpdate(poolHolderAccount);
        await poolAccount.approve(liquidityAccount);

        const sender = this.sender.getUnconstrainedV2();
        this.emitEvent("poolAdded", new PoolCreationEvent({ sender, poolAddress: newAccount, tokenAddress: token }));

    }

}