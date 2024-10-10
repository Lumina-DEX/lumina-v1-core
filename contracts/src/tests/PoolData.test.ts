import { FungibleToken, FungibleTokenAdmin } from 'mina-fungible-token';
import { AccountUpdate, Bool, CircuitString, fetchAccount, Field, Mina, Poseidon, PrivateKey, PublicKey, UInt64, UInt8, VerificationKey } from 'o1js';
import { contractHash, contractHolderHash, Faucet, PoolData, PoolFactory, PoolMina, PoolTokenHolder } from '../indexmina';
import { PoolSampleTest } from '../PoolSampleTest';
import { PoolUpgradeTest } from '../PoolUpgradeTest';

let proofsEnabled = false;


describe('Pool data', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    compileKey: VerificationKey,
    vk: any,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolFactory,
    zkPoolAddress: PublicKey,
    zkPoolPrivateKey: PrivateKey,
    zkPool: PoolMina,
    zkPoolDataAddress: PublicKey,
    zkPoolDataPrivateKey: PrivateKey,
    zkPoolData: PoolData,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress: PublicKey,
    zkTokenPrivateKey: PrivateKey,
    zkToken: FungibleToken,
    tokenHolder: PoolTokenHolder;

  beforeAll(async () => {
    //const analyze = await Faucet.analyzeMethods();
    //getGates(analyze);
    vk = await PoolSampleTest.compile();
    const compileResult = await PoolUpgradeTest.compile();
    compileKey = compileResult.verificationKey;
    if (proofsEnabled) {
      console.time('compile PoolData');
      await FungibleTokenAdmin.compile();
      await FungibleToken.compile();
      await PoolData.compile();
      await PoolFactory.compile();
      await PoolMina.compile();
      await PoolTokenHolder.compile();
      const compileResult = await PoolUpgradeTest.compile();
      compileKey = compileResult.verificationKey;
      console.timeEnd('compile PoolData');
    }

    function getGates(analyze: any) {
      for (const key in analyze) {
        if (Object.prototype.hasOwnProperty.call(analyze, key)) {
          const element = analyze[key];
          console.log(key, element?.gates.length)
        }
      }
    }
  });



  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount, bobAccount, aliceAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;
    bobKey = bobAccount.key;
    aliceKey = aliceAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new PoolFactory(zkAppAddress);

    zkPoolPrivateKey = PrivateKey.random();
    zkPoolAddress = zkPoolPrivateKey.toPublicKey();
    zkPool = new PoolMina(zkPoolAddress);

    zkTokenAdminPrivateKey = PrivateKey.random();
    zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey();
    zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress);

    zkPoolDataPrivateKey = PrivateKey.random();
    zkPoolDataAddress = zkPoolDataPrivateKey.toPublicKey();
    zkPoolData = new PoolData(zkPoolDataAddress);

    zkTokenPrivateKey = PrivateKey.random();
    zkTokenAddress = zkTokenPrivateKey.toPublicKey();
    zkToken = new FungibleToken(zkTokenAddress);

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken.deriveTokenId());

    const txn0 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkPoolData.deploy({
        poolHash: contractHash,
        poolHolderHash: contractHolderHash,
        owner: bobAccount,
        protocol: aliceAccount
      });

    });
    await txn0.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn0.sign([deployerKey, zkPoolDataPrivateKey]).send();

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.deploy({ symbol: "FAC", src: "https://luminadex.com/", poolData: zkPoolDataAddress });
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount,
      });
      await zkToken.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
      });
      await zkToken.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false),
      )
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey]).send();

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4);
      await zkApp.createPool(zkPoolAddress, zkTokenAddress);
    });

    console.log("Pool creation au", txn3.transaction.accountUpdates.length);
    await txn3.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send();

    // mint token to user
    await mintToken(senderAccount);
  });

  async function mintToken(user: PublicKey) {
    // token are minted to original deployer, so just transfer it for test
    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken.mint(user, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkTokenPrivateKey]).send();

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkToken.mint(deployerAccount, UInt64.from(1000 * 10 ** 9));
    });
    await txn.prove();
    await txn.sign([deployerKey, zkTokenPrivateKey]).send();

  }

  it('update owner', async () => {

    let owner = await zkPoolData.owner.fetch();
    expect(owner?.toBase58()).toEqual(bobAccount.toBase58());
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewOwner(senderAccount);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let newowner = await zkPoolData.newOwner.fetch();
    expect(newowner?.toBase58()).toEqual(senderAccount.toBase58());

    let oldowner = await zkPoolData.owner.fetch();
    expect(oldowner?.toBase58()).toEqual(bobAccount.toBase58());

    // aceept ownership
    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.acceptOwnership();
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    let ownership = await zkPoolData.owner.fetch();
    expect(ownership?.toBase58()).toEqual(senderAccount.toBase58());

  });

  it('update protocol', async () => {

    let protocol = await zkPoolData.protocol.fetch();
    expect(protocol?.toBase58()).toEqual(aliceAccount.toBase58());
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewProtocol(deployerAccount);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let protocolNew = await zkPoolData.protocol.fetch();
    expect(protocolNew?.toBase58()).toEqual(deployerAccount.toBase58());

  });

  const dataPool = "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";
  const hashPool = Field("6022389358534772890668465393330190115210352413664341627702449400961108940743");
  const dataPoolHolder = "AAB70YBptBMsdVk1VL0QQCugfZLamJMjVqpyGxmtZZ+nPAk2DiqWDRW/hblrAtJ71iSpL/OeyTQk/tt1uzUNDEUan4YuPVFj2nGuMBjCnDjSrEpk2/irvIPEuKbBYE+JDQnptgGqlI9pmyG9wq5G61F9tn9rN0IJjq6ft3OyCBxaGkErOVpxtwiYX4EO9S0Cozhsa856uiJZEWJAz0VyQf0PosT96YzUOqREgP2i/74nQHxfyh7nZTFQzpHrM7Ewwzs5TBEX9uw6F/txyjv4EtwS6j7ka3L8w85iucQ6AOl1AaPDmnCWrLyOj6x2DGaHs1QDQyc1vYDQsi7zpr/4O5spA/lIOMn/no+eTvjEw1sXC9WlFlZcPM0iVMzrqXsd9zAArgnT1BCC62zJA0JET+2wuxmaL7U/he6DtRTvrrc7MdfvWU/ODDVUUD2c41v0pXsbmWdN+cwqBDmiFShqZr8w4B0GVjctzYCXhcndiHXVbc26gvYCN0JROVHSRuzxpgdXJaztLrxQDvsLN+M9D90xCYmlVnViVVmzpFZr22AFASrN2T/rszvqOfeARKaUuFPRhsO+kCu2Wg7/86yGFrkNAN4ZmeTPPiM5sV0FtHB4Ec+PzXXO2Uftka7JWPoayj0JXYriqvegDKH13nwXgMCR+MYVs2wZrQbpaoFlMk+thDgiw3qZk6XUo8yDEIzyuQSLLcPfp5265CmW6Cakp/9TMi0OPVPb+MeLQlXVnz12p/XLFJVYXBKQc+L0Ro0m8vs/NhW3spcr/zMQ6NuLyeecIDT5M0FUoEjGZpwvHs2nFSBrYQyhvBv5aj8MAuEDo44uqslSD9cx5wKXnLPQX1AiGj2D5YUsArB5ayvvKgouSf9rZPcRtGlxhQq0/Coev9o7bG3vxy4ca77UcMPvSXLueLqW1IMhdHmm5tkNVsvSzi4bvbP6GpJg4Jgt5BdOc1i/eUSY+w5Ajdl9xSXUMhPKAEZeySGosMbRTUG6HHKAyyf6mUjKl4Q0jZPJ3ASZMGMhuhoY13i+Z0Ae4/Uj0DGd8FtFZRjvGl41g0O0Aje8FgvugGbLK7Eala5r1G/IcsLp6iyGjnEAObqjIMQKsOwqMJD1OGHKnxxJo33jTniyGSBzWw29WuFtcYvXoVDokfAxkJF8jipHroWWEk82d4l5tmiYPXBEtxkbLPzORK5tATqc7AZyze1L2hOtzu0RIhpOxGyGwdlbXulWP9nmyC8LJU/2Jc1rsbBR5MWxxmAS4tWQpMHHqUDQEKk1HCW34P444Cgb94oBGRsJRyUb4g2Cd7EIa6na0PdItw58F/3EBzblInKctWpHBunivNQAR+klmUbUR+Wcp5JNcglU6V1bNnEseyQTAf5K2WXxszi6nfavp+t6JqignqEh8b0xgp4usaASGD6eb7PzKCvpxt9svD8ZD9Bb96utPMHBhLYQqDI7OvK7zrnOEaP7ccFdIZbpazVTNZ+q+HqTviF6JW9RKliAzlDi/m1IRbm/K64IZjPYql+MnI6phxlP/GRAwMoLDTnvtCainlHvDnX2I4BYpyOuyC7G0DQ5jlw4YI4q9hspawmBgMCckIoV/wgpFIBWObQxysm24EmmaorUWYseDOIJB0GTWJFSQIZi8wNqupSz56Y+h29VUrmCkQ/Bh7oXOTCyZn0OmH+X0mQgcKLe7appX77+EEa6gATT9Fhk3QoRMKoguzaG94lk22z5Z1o78ugWYkk4yknEDbKlezPKM13qU01pYvjl3oOSRJulveMbmIRvkSPzugPreIYHZd4iaVa1Jy42KDTbIwEZTtU628jzSA8fv7M7YH/8mDhdJzQcY9+2dMAoo9dvVQkpNFFsgqmM7tKKqZfpEJrZSxuWOQDMUEu+H+UB523diaW61/2h0T0z7HA924ii9Neqmyx7Cw3YxQK/6970m4h3ArA6J077UzxO0dHXyNB+8L451NQP9cwBjKr4BQl5yNWBSpaAUvIoDOS1SqysESuJKO7d6BjWNQcKjZ9G6hJXlPKVyS3vvfjMwF3rsdvZIvZwBfcwGpYR56h5MFfuWvU+Ve/Q3K8LHuF/RmCurS9/9yPptJkk1h+yv9tciyrCK3fYfUbrg5FQ7UUA5PqrSd8yBcP5QTcENjo3nGHRRC2HqYID7yqWLFSyEWolcqN0bJE2atxEDMgkyqciZrufd3Iov/dlGcxQG0NDcRmuwgljLVk8K/4mY1fTEFlcPQ2536r3vvytZfMHzjL88I5kP+6LbWZ89CxCV0borJvUyd4YZcsN785xnRnNOJIbSaEUNC9OlWt3H4xa4r+1TuwxchJR788rt3Nb0BTCKHFyR9IDVlrSrCA3vd6IP+eTyI4e5q9uZdWPsBLts1IfGd01vnpBFgGhJyc=";
  const hashPoolHolder = Field("14876228843422336231707155776674524464588865100857502212615881432279939190870");


  it('update pool verification key', async () => {

    let hash = await zkPoolData.poolHash.fetch();
    expect(hash?.toString()).toEqual(contractHash.toString());

    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setPoolVerificationKeyHash(hashPool);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let newHash = await zkPoolData.poolHash.fetch();
    expect(newHash?.toString()).toEqual(hashPool.toString());

  });

  it('update pool holder verification key', async () => {

    let hash = await zkPoolData.poolHolderHash.fetch();
    expect(hash?.toString()).toEqual(contractHolderHash.toString());

    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setPoolHolderVerificationKeyHash(hashPoolHolder);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let newHash = await zkPoolData.poolHolderHash.fetch();
    expect(newHash?.toString()).toEqual(hashPoolHolder.toString());

  });

  it('update verification key', async () => {
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.updateVerificationKey(vk.verificationKey);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let poolDatav2 = new PoolSampleTest(zkPoolDataAddress);
    let version = await poolDatav2.version();
    expect(version?.toBigInt()).toEqual(2n);

  });

  it('update pool', async () => {
    if (!proofsEnabled) {
      // return;
    }
    console.log("update pool");
    const newVK = await PoolUpgradeTest.compile();
    const key = newVK.verificationKey;
    key.hash = Field(2);
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setPoolVerificationKeyHash(Field(2));
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    const txn1 = await Mina.transaction(deployerAccount, async () => {
      await zkPool.updateVerificationKey(key);
    });
    await txn1.prove();
    await txn1.sign([deployerKey]).send();

  });

  it('failed without owner key', async () => {
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.updateVerificationKey(vk.verificationKey);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewOwner(senderAccount);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewProtocol(senderAccount);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setPoolHolderVerificationKeyHash(hashPoolHolder);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setPoolVerificationKeyHash(hashPoolHolder);
    });
    await txn.prove();
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();
  });

  it('failed change owner', async () => {
    let owner = await zkPoolData.owner.fetch();
    expect(owner?.toBase58()).toEqual(bobAccount.toBase58());
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.setNewOwner(aliceAccount);
    });
    await txn.prove();
    await txn.sign([senderKey, bobKey]).send();

    let newowner = await zkPoolData.newOwner.fetch();
    expect(newowner?.toBase58()).toEqual(aliceAccount.toBase58());

    let oldowner = await zkPoolData.owner.fetch();
    expect(oldowner?.toBase58()).toEqual(bobAccount.toBase58());

    // aceept ownership
    txn = await Mina.transaction(senderAccount, async () => {
      await zkPoolData.acceptOwnership();
    });
    await txn.prove();
    // you need to sign with the new owner key to get the ownership
    await expect(txn.sign([senderKey]).send()).rejects.toThrow();

    let ownership = await zkPoolData.owner.fetch();
    expect(ownership?.toBase58()).toEqual(bobAccount.toBase58());
  });
});