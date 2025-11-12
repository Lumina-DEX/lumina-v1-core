import { Field, Mina } from "o1js"
import {
  PoolFactory,
  FungibleTokenAdmin,
  FungibleToken
} from "../index"


describe("Check verification key", () => {
  it("has a valid verification key", async () => {
    const network = Mina.Network({
      networkId: "mainnet",
      mina: "https://api.minascan.io/node/mainnet/v1/graphql",
    });
    Mina.setActiveInstance(network)

    await FungibleTokenAdmin.compile()
    await FungibleToken.compile()
    const vkFactory = await PoolFactory.compile()
    expect(vkFactory.verificationKey.hash).toEqual(
      Field(21955258744905199326476551523512075073823567754306600871892901345442326387142n)
    )
  }, 600000)
})
