import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey, Poseidon } from 'o1js';


export interface PoolDataDeployProps extends Exclude<DeployArgs, undefined> {
    protocol: PublicKey;
    owner: PublicKey;
    poolHash: Field;
    poolHolderHash: Field;
}

/**
 * Pool informations, use to manage protocol, receiver and verification key update
 */
export class PoolData extends SmartContract {

    events = {
        upgradePool: Field,
        upgradePoolHolder: Field,
        upgrade: Field,
        setNewOwner: PublicKey,
        acceptOwnership: PublicKey,
        updateProtocol: PublicKey
    };

    @state(PublicKey) protocol = State<PublicKey>();
    @state(PublicKey) owner = State<PublicKey>();
    @state(PublicKey) newOwner = State<PublicKey>();
    @state(Field) poolHash = State<Field>();
    @state(Field) poolHolderHash = State<Field>();

    async deploy(args: PoolDataDeployProps) {
        await super.deploy();

        args.protocol.isEmpty().assertFalse("Protocol empty");
        args.owner.isEmpty().assertFalse("Owner empty");
        args.poolHash.equals(Field.empty()).assertFalse("Pool verification key hash empty");
        args.poolHolderHash.equals(Field.empty()).assertFalse("Pool token holder verification key hash empty");

        this.protocol.set(args.protocol);
        this.owner.set(args.owner);
        this.poolHash.set(args.poolHash);
        this.poolHolderHash.set(args.poolHolderHash);

        let permissions = Permissions.default();
        permissions.access = Permissions.proofOrSignature();
        permissions.setPermissions = Permissions.impossible();
        permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion();
        this.account.permissions.set(permissions);
    }

    /**
    * Upgrade to a new version
    * @param vk new verification key
    */
    @method async updateVerificationKey(vk: VerificationKey) {
        const owner = this.owner.getAndRequireEquals();
        // check if owner signed the tx
        AccountUpdate.createSigned(owner);

        this.account.verificationKey.set(vk);
        this.emitEvent("upgrade", vk.hash);
    }

    @method async setPoolVerificationKey(vk: VerificationKey) {
        const owner = this.owner.getAndRequireEquals();
        // check if owner signed the tx
        AccountUpdate.createSigned(owner);

        this.poolHash.set(vk.hash);
        this.emitEvent("upgradePool", vk.hash);
    }

    @method async setPoolHolderVerificationKey(vk: VerificationKey) {
        const owner = this.owner.getAndRequireEquals();
        // check if owner signed the tx
        AccountUpdate.createSigned(owner);

        this.poolHolderHash.set(vk.hash);
        this.emitEvent("upgradePoolHolder", vk.hash);
    }

    @method async setNewOwner(newOwner: PublicKey) {
        const owner = this.owner.getAndRequireEquals();
        // check if owner signed the tx
        AccountUpdate.createSigned(owner);

        // two steps upgrade to prevent bad update
        this.newOwner.set(newOwner);
        this.emitEvent("setNewOwner", newOwner);
    }

    @method async acceptOwnership() {
        const newOwner = this.newOwner.getAndRequireEquals();
        // check if newOwner signed the tx
        AccountUpdate.createSigned(newOwner);

        // two steps upgrade to prevent bad update
        this.owner.set(newOwner);
        this.emitEvent("acceptOwnership", newOwner);
    }

    @method async setNewProtocol(newProtocol: PublicKey) {
        const owner = this.owner.getAndRequireEquals();
        // check if owner signed the tx
        AccountUpdate.createSigned(owner);

        this.protocol.set(newProtocol);
        this.emitEvent("updateProtocol", newProtocol);
    }
}
