import { AccountUpdate, Bool, Cache, fetchAccount, Field, MerkleMap, Mina, Poseidon, PrivateKey, Provable, PublicKey, Signature, UInt32, UInt64, UInt8 } from 'o1js';

import { FungibleTokenAdmin, FungibleToken, mulDiv, PoolFactory, PoolTokenHolder, Pool } from '../index';



describe('Benchmark', () => {
  let
    zkPoolTokenAMina: Pool,
    feepayerAddress: PublicKey,
    fee: number,
    zkPoolTokenAMinaAddress: PublicKey,
    zkTokenA: FungibleToken,
    zkTokenAAddress: PublicKey,
    Local: any;

  beforeAll(async () => {
    const cache = Cache.FileSystem('./cache');

    console.time('compile pool');
    await FungibleToken.compile({ cache });
    await Pool.compile({ cache });
    await PoolTokenHolder.compile({ cache });
    console.timeEnd('compile pool');

    Local = Mina.Network({
      // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
      // This is to ensure the backward compatibility.
      networkId: "testnet",
      mina: "https://api.minascan.io/node/devnet/v1/graphql",
      archive: "https://api.minascan.io/archive/devnet/v1/graphql"
    })

    fee = Number(0.1) * 1e9 // in nanomina (1 billion = 1.0 mina)
    Mina.setActiveInstance(Local)
    feepayerAddress = PublicKey.fromBase58("B62qrUAGW6S4pSBcZko2LdbUAhtLd15zVs9KtQedScBvwuZVbcnej35")
    zkPoolTokenAMinaAddress = PublicKey.fromBase58("B62qp71rC3GU4bzoB6DfhrydBwkZ94R91JmfLevffMxBipRNcTxeYvh")
    zkPoolTokenAMina = new Pool(zkPoolTokenAMinaAddress)
    zkTokenAAddress = PublicKey.fromBase58("B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha")
    zkTokenA = new FungibleToken(zkTokenAAddress)
  });


  it('swap from mina', async () => {
    console.time("swap Mina")
    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress })
    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() })
    await fetchAccount({ publicKey: feepayerAddress })
    await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() })

    const amountIn = UInt64.from(1.3 * 10 ** 9)
    const dexTokenHolder = new PoolTokenHolder(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

    const reserveIn = Mina.getBalance(zkPoolTokenAMinaAddress)
    const reserveOut = Mina.getBalance(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
    const minOut = expectedOut.sub(expectedOut.div(100))

    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      // AccountUpdate.fundNewAccount(feepayerAddress, 1);
      await dexTokenHolder.swapFromMinaToToken(
        feepayerAddress,
        UInt64.from(5),
        amountIn,
        minOut,
        balanceMax,
        balanceMin
      )
      await zkTokenA.approveAccountUpdate(dexTokenHolder.self)
    })
    await tx.prove()
    console.timeEnd("swap Mina")
    console.log("swap mina proof", tx.toPretty())
  });

  it('swap from token', async () => {
    console.time("swap Token")
    const amountIn = UInt64.from(20 * 10 ** 9)

    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress })
    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() })
    await fetchAccount({ publicKey: feepayerAddress })
    await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() })

    const reserveOut = Mina.getBalance(zkPoolTokenAMinaAddress)
    const reserveIn = Mina.getBalance(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
    const minOut = expectedOut.sub(expectedOut.div(100))

    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      await zkPoolTokenAMina.swapFromTokenToMina(
        feepayerAddress,
        UInt64.from(5),
        amountIn,
        minOut,
        balanceMax,
        balanceMin
      )
    })
    await tx.prove()
    console.timeEnd("swap Token")
    console.log("swap token proof", tx.toPretty())

  });

});