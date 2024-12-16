import { AccountUpdate, AccountUpdateForest, DeployArgs, Field, MerkleWitness, method, Permissions, Poseidon, PublicKey, State, state, Struct, TokenContractV2, UInt64, VerificationKey } from "o1js"

export interface FarmRewardDeployProps extends Exclude<DeployArgs, undefined> {
  merkleRoot: Field,
  token: PublicKey,
  owner: PublicKey
}

export class MintEvent extends Struct({
  sender: PublicKey
}) {
  constructor(value: {
    sender: PublicKey
  }) {
    super(value)
  }
}

export class ClaimEvent extends Struct({
  user: PublicKey,
  amount: UInt64
}) {
  constructor(value: {
    user: PublicKey
    amount: UInt64
  }) {
    super(value)
  }
}


// support 8192 different claimer
export class FarmMerkleWitness extends MerkleWitness(8192) { }

/**
 * Farm reward contract
 */
export class FarmReward extends TokenContractV2 {
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(PublicKey)
  token = State<PublicKey>()
  @state(Field)
  merkleRoot = State<Field>()

  events = {
    upgrade: Field,
    claim: ClaimEvent,
    mint: MintEvent
  }

  async deploy(args: FarmRewardDeployProps) {
    await super.deploy()

    args.merkleRoot.equals(Field(0)).assertFalse("Merkle root is empty")
    args.owner.isEmpty().assertFalse("Owner is empty")

    this.owner.set(args.owner)
    this.merkleRoot.set(args.merkleRoot)
    this.token.set(args.token)

    let permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.send = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  /** Approve `AccountUpdate`s that have been created outside of the token contract.
   *
   * @argument {AccountUpdateForest} updates - The `AccountUpdate`s to approve. Note that the forest size is limited by the base token contract, @see TokenContractV2.MAX_ACCOUNT_UPDATES The current limit is 9.
   */
  @method
  async approveBase(updates: AccountUpdateForest): Promise<void> {
    updates.isEmpty().assertTrue("You can't manage the token")
  }

  /**
   * Upgrade to a new version
   * @param vk new verification key
   */
  @method
  async updateVerificationKey(vk: VerificationKey) {
    const owner = await this.owner.getAndRequireEquals()

    // only owner can update a pool
    AccountUpdate.createSigned(owner)

    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", vk.hash)
  }

  @method
  async claimReward(amount: UInt64, path: FarmMerkleWitness) {
    const farmReward = new FarmReward(this.address);
    const sender = this.sender.getAndRequireSignatureV2()
    const senderBalance = AccountUpdate.create(sender, farmReward.deriveTokenId())
    senderBalance.account.balance.requireEquals(UInt64.zero)
    const fieldSender = sender.toFields()
    const hash = Poseidon.hash([fieldSender[0], fieldSender[1], amount.value])
    const root = this.merkleRoot.getAndRequireEquals()
    path.calculateRoot(hash).assertEquals(root, "Invalid request")
    this.send({ to: sender, amount: amount });

    // to prevent double withdraw we mint one token once a user withdraw
    this.internal.mint({ address: sender, amount: UInt64.one })
    this.emitEvent("mint", new MintEvent({ sender }))
    this.emitEvent("claim", new ClaimEvent({ user: sender, amount }))

  }

  @method
  async withdrawDust() {
    const sender = this.sender.getAndRequireSignatureV2()
    this.owner.requireEquals(sender)
    // only owner can withdraw dust
    const accountBalance = this.account.balance.getAndRequireEquals()
    this.send({ to: sender, amount: accountBalance })
    this.emitEvent("claim", new ClaimEvent({ user: sender, amount: accountBalance }))
  }

  /**
   * Don't call this method directly
   */
  @method
  async mint(sender: PublicKey) {
    const caller = this.sender.getAndRequireSignatureV2();
    caller.assertEquals(sender);
    // check user never withdraw
    const senderBalance = AccountUpdate.create(sender, this.deriveTokenId())
    senderBalance.account.balance.requireEquals(UInt64.zero)

    this.internal.mint({ address: sender, amount: UInt64.one })
    this.emitEvent("mint", new MintEvent({ sender }))
  }
}
