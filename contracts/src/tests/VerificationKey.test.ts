import { Cache, Mina } from "o1js"
import {
  FungibleToken,
  FungibleTokenAdmin,
  Pool,
  PoolFactory,
  PoolTokenHolder,
  poolHashTestnet, poolTokenHolderHashTestnet,
  poolTokenHolderHashMainnet, poolHashMainnet
} from "../index"


describe("Check verification key", () => {
  it("has a valid verification key", async () => {
    const network = Mina.Network({
      networkId: "devnet",
      mina: "https://api.minascan.io/node/devnet/v1/graphql",
    });
    Mina.setActiveInstance(network)

    const vkFactory = await PoolFactory.compile()
    expect(vkFactory.verificationKey.hash.toBigInt()).toEqual(
      21155315920244513361696679354690742153476743044380974966337181307650568441726n
    )
    const vkPool = await Pool.compile()
    expect(vkPool.verificationKey.hash.toBigInt()).toEqual(poolHashTestnet.toBigInt())
    const vkPoolHolder = await PoolTokenHolder.compile()
    expect(vkPoolHolder.verificationKey.hash.toBigInt()).toEqual(poolTokenHolderHashTestnet.toBigInt())
  }, 600000)

  it("has a valid verification key", async () => {
    const network = Mina.Network({
      networkId: "mainnet",
      mina: "https://api.minascan.io/node/mainnet/v1/graphql",
    });
    Mina.setActiveInstance(network)

    const vkFactory = await PoolFactory.compile()
    expect(vkFactory.verificationKey.hash.toBigInt()).toEqual(
      21955258744905199326476551523512075073823567754306600871892901345442326387142n
    )
    const vkPool = await Pool.compile()
    expect(vkPool.verificationKey.hash.toBigInt()).toEqual(poolHashMainnet.toBigInt())
    const vkPoolHolder = await PoolTokenHolder.compile()
    expect(vkPoolHolder.verificationKey.hash.toBigInt()).toEqual(poolTokenHolderHashMainnet.toBigInt())
  }, 600000)
})
