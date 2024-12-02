import { Field, SmartContract, state, Permissions, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Poseidon, VerificationKey, Reducer, Account, assert, fetchAccount, MerkleList, TransactionVersion, TokenContractV2, DeployArgs, TokenId, CircuitString, Signature, ZkProgram, MerkleMap, MerkleTree, MerkleWitness } from 'o1js';
import { FungibleToken, Pool, PoolTokenHolder } from '../indexpool.js';
import { newAccount } from 'o1js/dist/node/lib/mina/account.js';


export const contractData = "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";
export const contractHash = Field(22863932686472382096042512859320828168173457836668795823491170144130775653136n);
export const contractHolderData = "AABvj1TjS95sAoY8puZRG2h4hxjs9c5enwfo4vZAQC/COWHgEjNupRIxb3LVxaRU2mkaG94By4OqrJ3M7YXNs4oiAhMdOuU5+NrHN3RCJtswX+WPvwaHJnihtSy2FcJPyghvBVTi2i7dtWIPQLVDIzC5ARu8f8H9JWjzjVVYE/rQLruuq2qUsCrqdVsdRaw+6OjIFeAXS6mzvrVv5iYGslg5CV5mgLBg3xC408jZJ0pe8ua2mcIEDMGEdSR/+VuhPQaqxZTJPBVhazVc1P9gRyS26SdOohL85UmEc4duqlJOOlXOFuwOT6dvoiUcdQtzuPp1pzA/LHueqm9yQG9mlT0Df8uY/A+rwM4l/ypTP/o0+5GCM9jJf9bl/z0DpGWheCJY+LZbIGeBUOpg0Gx1+KZsD9ivWJ0vxNz8zKcAS1i3FqFhahkJHiiKgikn6Qig5+Yf3MJs0WKSNkCkgW2B48srVTR9ykLyO+68NiWLEnLXvJd+rmUHR4K92whqctZZ8zvd2+5u+b62pkvFqqZZ9r24SMQOe9Bl2ZfMew2DyFLMPzwTowHw8onMEXcVKabFs9zQVp66AMf/wlipirNztdguACp7/5HFhEWJACS+MOyhQerII84FzR+xEU6kv5QWXjk3iOi404L+fX0tWx2aQ2pCNccEslOUuffFtwGCfiDnRgbO1bp+HP3Boc7kKrX/iv4GkLKMcz2P2upfqy/9KL2UIgJ8Le11EX6uTGdkTc/rRUZ/ZZi1rhYqUlmdqTbbBJ4T6sRfrXOdH5l+QV7vR2v385RKRtfnmcJeUQcpq5/JTgVwagDJ/FarTN5jFsrBBRTeW3yZ5/CfVNA7NNWxoKhjBaHVIhn/fLT5sFLYzYdCx/uTsusyZmE2d6iqnLS+j1IXNJX/zR0ZD3aGuoUc4MaFZQnN5om4dfpbloe4Roob3BuDhBHTKoYC+nVsyEvDRyiYLEOjJ45/bSwTCfwngYKtNmo3sVTvQ9mqBf0cLdBCn8skp3S/gz324TFm8iJ+t8EWD4wbWBo0khKZ4rxxryJpfUh5N9mS0dD7l5O+4pBSvhprrk3UrrqpoHuP8IeN7OjNamdvokqX+vOMmbOwVvrfEYiQtw5vTqrqb73HS68pkT+OuRJD+rMiLrr0dyYwM2gPtMTmgUHiLoM1qjdzZZPCLU+tL2tXWD6QWxk7UAiWrj0MqH5O4Df/c6DNekL1d6QYnjO0/3LMvY/f/y1+b7nPHI8+1Wqp5jZH8UsuN63SSMdfBEe6x46AG/R+YS/wH78GKekabWu9QQnUJdjXyXiqF4qRebvfcmpQz91anvVz3ggBqCv4sYqCIvP0ysDtMdi36zFErV+8SdUu+NsPDGvdPSCGdLuC25izxb21up2HORmlM5R7yuIW3rCiq8DeLD0OHjqOBZ+IEv9zEkb5fHTJvxoxnZlArtZSBpD6iIDPVDymuK+BsOggZav3K+TytjeD2Gcld5NfyRISFWUIMkZNFQRL8AQpET6RJnG1HSW0CaRfNeomtjCBWIr85wFCrp06j/D1J8B3EyhloZLJJ6ywxt41smXVugxA8LRTO+6lVBOBF14jHQCCUl6u7uiWCe1z4/bC5wQXPwWSljp8NVU8Erp1U9ModNK7W63Pkh0efvgSD5d0nLzbfa0jTdxZ1JkfKsnvYk43Ed+vmXooHZhUeZAIX8ZCizhb1Gfvm02JFwxYXmiYAOp5wkGzweU2I5zo8r5yZFI1r4XibNQs7eAfKGRv3gh8/EuLkX/bdettgPvNsI8ndpQ3kL/V8W2PQN4/hjC9AKCYBeXQG42bRncYZdLe++R2KA1ZdPDxQPF3sxUIKhzmRWqbozrtv310Maorwv6eZJjldlCJwICR9QgcDwDuNj+UFJnX3RWsdIWsUbI1T4wO0sE2sBiMX/OqmiGJEAnBegioistlFyfRvm54h+duNOl/ol1Fva7NoXvsL/wThAWUly7bnc7/Al2bBQlUrmEX46UnKXzYntkZDee7Lx1u1BBkJAj/5BH1YZOPmMCh498rBUiHmc+4uQqebqNSHdOSgC39ESss4u7GNhWj3fi9XXta6UT9wapEMGq0WTg2Kry6xNP2YZ5X8eaapRQc/KzYgz9XjQL6TKpqNuGEbRlmfYvIuoFbnOkZI7RYoGp3YheMs1pQErwOxLzZa9W3Okwx16TSDwPLR0xMdAyogMrOdKN4JSMyNnmOaoVf6PkN+K9fz7RuHtvgjKpuz4vsK5Z2wRneqPrnfu6PkgHcRQrd0SxqCbN23Z/yp8qOcN6XU49iCNEBjztT00tolQ9hCPMSE/eTZ+ioez7m3pJFVks3T5Rk/e+6MeowJWIOv20x6CPS9mhpr1JPwdNFrWdgs19VsobntCpF/rWxksdrYyk=";
export const contractHolderHash = Field(22705468212065306394746618536380829871648986302008080236168753169637024864216n);

export interface PoolDeployProps extends Exclude<DeployArgs, undefined> {
    symbol: string;
    src: string;
    protocol: PublicKey;
    owner: PublicKey;
    delegator: PublicKey;
    approvedSigner: Field;
}

export class PoolCreationEvent extends Struct({
    sender: PublicKey,
    poolAddress: PublicKey,
    token0Address: PublicKey,
    token1Address: PublicKey
}) {
    constructor(value: {
        sender: PublicKey,
        poolAddress: PublicKey,
        token0Address: PublicKey,
        token1Address: PublicKey
    }) {
        super(value);
    }
}

// 32 approved signer possible
export class SignerMerkleWitness extends MerkleWitness(32) { }

/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContractV2 {

    @state(Field) approvedSigner = State<Field>();
    @state(PublicKey) owner = State<PublicKey>();
    @state(PublicKey) protocol = State<PublicKey>();
    @state(PublicKey) delegator = State<PublicKey>();


    events = {
        poolAdded: PoolCreationEvent,
        upgrade: Field,
        updateSigner: Field,
        updateProtocol: PublicKey,
        updateDelegator: PublicKey,
        updateOwner: PublicKey
    };

    async deploy(args: PoolDeployProps) {
        await super.deploy(args);
        args.owner.isEmpty().assertFalse("Owner is empty");

        this.account.zkappUri.set(args.src);
        this.account.tokenSymbol.set(args.symbol);
        this.approvedSigner.set(args.approvedSigner);
        this.owner.set(args.owner);
        this.protocol.set(args.protocol);
        this.delegator.set(args.delegator);

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
        await this.getOwnerSignature();
        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }

    @method async updateApprovedSigner(newSigner: Field) {
        await this.getOwnerSignature();
        this.approvedSigner.set(newSigner);
        this.emitEvent("updateSigner", newSigner);
    }

    @method async setNewOwner(newOwner: PublicKey) {
        await this.getOwnerSignature();
        this.owner.set(newOwner);
        this.emitEvent("updateOwner", newOwner);
    }

    @method async setNewProtocol(newProtocol: PublicKey) {
        await this.getOwnerSignature();
        this.protocol.set(newProtocol);
        this.emitEvent("updateProtocol", newProtocol);
    }

    @method async setNewDelegator(newDelegator: PublicKey) {
        await this.getOwnerSignature();
        this.delegator.set(newDelegator);
        this.emitEvent("updateDelegator", newDelegator);
    }

    @method.returns(PublicKey) async getProtocol() {
        const protocol = this.protocol.getAndRequireEquals();
        return protocol;
    }

    @method.returns(PublicKey) async getOwner() {
        const owner = this.owner.getAndRequireEquals();
        return owner;
    }

    @method.returns(PublicKey) async getDelegator() {
        const delegator = this.delegator.getAndRequireEquals();
        return delegator;
    }

    @method
    async approveBase(forest: AccountUpdateForest) {
        forest.isEmpty().assertTrue("You can't approve any token operation");
    }

    /**
    * Create a new pool
    * @param newAccount address of the new pool
    * @param token for which the pool is created
    * @param signer who sign the argument
    * @param signature who proves you can deploy this pool (only approved signer or token owner can deploy a pool)
    * @param path merkle witness to check if signer is in the approved list
    */
    @method
    async createPool(newAccount: PublicKey, token: PublicKey, signer: PublicKey, signature: Signature, path: SignerMerkleWitness) {
        token.isEmpty().assertFalse("Token is empty");
        await this.createAccounts(newAccount, token, PublicKey.empty(), token, signer, signature, path, false);
    }

    /**
     * Create a new pool token
     * @param newAccount address of the new pool
     * @param token 0 of the pool
     * @param token 1 of the pool
     * @param signer who sign the argument
     * @param signature who proves you can deploy this pool (only approved signer or token owner can deploy a pool)
     * @param path merkle witness to check if signer is in the approved list
     */
    @method
    async createPoolToken(newAccount: PublicKey, token0: PublicKey, token1: PublicKey, signer: PublicKey, signature: Signature, path: SignerMerkleWitness) {
        token0.x.assertLessThan(token1.x, "Token 0 need to be lesser than token 1");
        // create an address with the 2 public key as pool id
        const fields = token0.toFields().concat(token1.toFields());
        const publicKey = PublicKey.fromFields(fields);
        publicKey.isEmpty().assertFalse("publicKey is empty");
        await this.createAccounts(newAccount, publicKey, token0, token1, signer, signature, path, true);
    }

    private async createAccounts(newAccount: PublicKey, token: PublicKey, token0: PublicKey, token1: PublicKey, signer: PublicKey, signature: Signature, path: SignerMerkleWitness, isTokenPool: boolean) {
        let tokenAccount = AccountUpdate.create(token, this.deriveTokenId());
        // if the balance is not zero, so a pool already exist for this token
        tokenAccount.account.balance.requireEquals(UInt64.zero);

        // verify the signer has right to create the pool
        signer.equals(PublicKey.empty()).assertFalse("Empty signer");
        const signerHash = Poseidon.hash(signer.toFields());
        const approvedSignerRoot = this.approvedSigner.getAndRequireEquals();
        const approvedSigner = path.calculateRoot(signerHash).equals(approvedSignerRoot);
        const signerToken0 = signer.equals(token0);
        const signerToken1 = signer.equals(token1);
        approvedSigner.or(signerToken0).or(signerToken1).assertTrue("Invalid signer");
        signature.verify(signer, newAccount.toFields()).assertTrue("Invalid signature");

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
                setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
                send: Permissions.proof(),
                setDelegate: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };

        // set poolAccount initial state
        const appState = this.createState(token0, token1);
        poolAccount.body.update.appState = appState;

        // Liquidity token default name
        poolAccount.account.tokenSymbol.set("LUM");

        // create a token holder as this new address
        if (isTokenPool) {
            // only pool token need an account at token 0 address
            await this.createPoolHolderAccount(newAccount, token0, appState);
        }
        await this.createPoolHolderAccount(newAccount, token1, appState);

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

        await poolAccount.approve(liquidityAccount);

        const sender = this.sender.getUnconstrainedV2();
        this.emitEvent("poolAdded", new PoolCreationEvent({ sender, poolAddress: newAccount, token0Address: token0, token1Address: token1 }));
    }

    private createState(token0: PublicKey, token1: PublicKey) {
        let token0Fields = token0.toFields();
        let token1Fields = token1.toFields();
        let poolFactory = this.address.toFields();
        let protocol = this.protocol.getAndRequireEquals();
        let protocolFields = protocol.toFields();

        return [
            { isSome: Bool(true), value: token0Fields[0] },
            { isSome: Bool(true), value: token0Fields[1] },
            { isSome: Bool(true), value: token1Fields[0] },
            { isSome: Bool(true), value: token1Fields[1] },
            { isSome: Bool(true), value: poolFactory[0] },
            { isSome: Bool(true), value: poolFactory[1] },
            { isSome: Bool(true), value: protocolFields[0] },
            { isSome: Bool(true), value: protocolFields[1] },
        ];
    }

    private async createPoolHolderAccount(newAccount: PublicKey, token: PublicKey, appState: { isSome: Bool; value: Field; }[]): Promise<AccountUpdate> {
        const fungibleToken = new FungibleToken(token);
        const poolHolderAccount = AccountUpdate.createSigned(newAccount, fungibleToken.deriveTokenId());
        // Require this account didn't already exist
        poolHolderAccount.account.isNew.requireEquals(Bool(true));

        // set pool token holder account vk and permission
        poolHolderAccount.body.update.verificationKey = { isSome: Bool(true), value: { data: contractHolderData, hash: contractHolderHash } };
        poolHolderAccount.body.update.permissions = {
            isSome: Bool(true),
            value: {
                ...Permissions.default(),
                setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
                send: Permissions.proof(),
                setPermissions: Permissions.impossible()
            },
        };
        poolHolderAccount.body.update.appState = appState;
        await fungibleToken.approveAccountUpdate(poolHolderAccount);
        return poolHolderAccount;
    }

    private async getOwnerSignature() {
        const owner = this.owner.getAndRequireEquals();
        // only owner can update a pool
        AccountUpdate.createSigned(owner);
    }
}