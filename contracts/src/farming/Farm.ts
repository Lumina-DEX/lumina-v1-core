import { AccountUpdate, AccountUpdateForest, DeployArgs, Field, method, Permissions, Provable, PublicKey, State, state, Struct, TokenContractV2, UInt64, VerificationKey } from "o1js"
import { Pool } from "../indexpool.js"

export class FarmingInfo extends Struct({
  startTimestamp: UInt64,
  endTimestamp: UInt64
}) {
  constructor(value: {
    startTimestamp: UInt64
    endTimestamp: UInt64
  }) {
    super(value)
  }
}

export class FarmingEvent extends Struct({
  sender: PublicKey,
  amount: UInt64
}) {
  constructor(value: {
    sender: PublicKey
    amount: UInt64
  }) {
    super(value)
  }
}

export class BurnEvent extends Struct({
  sender: PublicKey,
  amount: UInt64
}) {
  constructor(value: {
    sender: PublicKey
    amount: UInt64
  }) {
    super(value)
  }
}

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  pool: PublicKey
  owner: PublicKey
  startTimestamp: UInt64
  endTimestamp: UInt64
}

/**
 * Farm contract
 */
export class Farm extends TokenContractV2 {
  // Farming for one pool
  @state(PublicKey)
  pool = State<PublicKey>()
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(UInt64)
  startTimestamp = State<UInt64>()
  @state(UInt64)
  endTimestamp = State<UInt64>()

  events = {
    upgrade: Field,
    deposit: FarmingEvent,
    burn: BurnEvent,
  }

  async deploy(args: FarmingDeployProps) {
    await super.deploy(args)

    args.pool.isEmpty().assertFalse("Pool empty")
    args.owner.isEmpty().assertFalse("Owner empty")

    const currentTimestamp = this.network.timestamp.getAndRequireEquals()
    // args.startTimestamp.assertGreaterThanOrEqual(
    //   currentTimestamp,
    //   "Start timestamp need to be greater or equal to the current timestamp"
    // )
    args.endTimestamp.assertGreaterThan(
      currentTimestamp,
      "End timestamp need to be greater than current timestamp"
    )

    this.pool.set(args.pool)
    this.owner.set(args.owner)
    this.startTimestamp.set(args.startTimestamp)
    this.endTimestamp.set(args.endTimestamp)

    let permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.send = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  /** 
   *  Transfer is locked only depositor can withdraw his token
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
  async deposit(amount: UInt64) {
    const startTimestamp = this.startTimestamp.getAndRequireEquals()
    const endTimestamp = this.endTimestamp.getAndRequireEquals()
    Provable.log("startTimestamp", startTimestamp);
    Provable.log("endTimestamp", endTimestamp);
    const currentTimestamp = this.network.timestamp.getAndRequireEquals();
    Provable.log("timestamp", currentTimestamp);
    // user can deposit only during this period
    this.network.timestamp.requireBetween(startTimestamp, endTimestamp)

    const poolAddress = this.pool.getAndRequireEquals()
    const pool = new Pool(poolAddress)
    const sender = this.sender.getUnconstrainedV2()
    // transfer amount to this account
    await pool.transfer(sender, this.address, amount)
    this.internal.mint({ address: sender, amount })
    this.emitEvent("deposit", new FarmingEvent({ sender, amount }))
  }


  /**
   * Don't call this method directly
   */
  @method
  async burnLiquidity(sender: PublicKey, amount: UInt64) {
    const caller = this.sender.getAndRequireSignatureV2();
    caller.assertEquals(sender);
    this.internal.burn({ address: sender, amount })
    this.emitEvent("burn", new BurnEvent({ sender, amount }))
  }
}
