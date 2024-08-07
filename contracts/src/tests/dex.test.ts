import { Account, AccountUpdate, Bool, Field, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';

import { createDex, TokenContract, addresses, keys } from '../dex/dex';

let proofsEnabled = false;


let { Dex, DexTokenHolder, getTokenBalances } = createDex();

describe('Dex Proof', () => {

    let deployerAccount: Mina.TestPublicKey,
        deployerKey: PrivateKey,
        senderAccount: Mina.TestPublicKey,
        senderKey: PrivateKey,
        bobAccount: Mina.TestPublicKey,
        bobKey: PrivateKey,
        aliceAccount: Mina.TestPublicKey,
        aliceKey: PrivateKey,
        zkAppAddress: PublicKey,
        zkAppPrivateKey: PrivateKey,
        zkApp: any,
        zkToken0Address: PublicKey,
        zkToken0PrivateKey: PrivateKey,
        zkToken0: TokenContract,
        zkToken1Address: PublicKey,
        zkToken1PrivateKey: PrivateKey,
        zkToken1: TokenContract,
        tokenHolder0: any,
        tokenHolder1: any;


    beforeEach(async () => {
        const gate = await Dex.analyzeMethods();
        getGates(gate);


        function getGates(analyze: any) {
            for (const key in analyze) {
                if (Object.prototype.hasOwnProperty.call(analyze, key)) {
                    const element = analyze[key];
                    console.log(key, element?.gates.length)
                }
            }
        }

        const Local = await Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        [deployerAccount, senderAccount, bobAccount, aliceAccount] = Local.testAccounts;
        deployerKey = deployerAccount.key;
        senderKey = senderAccount.key;
        bobKey = bobAccount.key;
        aliceKey = aliceAccount.key;

        zkAppPrivateKey = PrivateKey.random();
        zkAppAddress = zkAppPrivateKey.toPublicKey();
        zkApp = new Dex(zkAppAddress);

        zkToken0PrivateKey = keys.tokenX;
        zkToken0Address = zkToken0PrivateKey.toPublicKey();
        zkToken0 = new TokenContract(zkToken0Address);

        zkToken1PrivateKey = keys.tokenY;
        zkToken1Address = zkToken1PrivateKey.toPublicKey();
        zkToken1 = new TokenContract(zkToken1Address);

        if (proofsEnabled) {
            console.time('compile token');
            const tokenKey = await TokenContract.compile();
            console.timeEnd('compile token');
            console.time('compile pool');
            const key = await Dex.compile();
            await DexTokenHolder.compile();
            console.timeEnd('compile pool');
            console.log("key pool", key.verificationKey.data);
            console.log("key pool hash", key.verificationKey.hash.toBigInt());
        }

        let txn = await Mina.transaction(deployerAccount, async () => {
            await zkToken0.deploy();
            await zkToken1.deploy();

            const accountFee = Mina.getNetworkConstants().accountCreationFee;
            let feePayerUpdate = AccountUpdate.fundNewAccount(deployerAccount, 2);
            feePayerUpdate.send({ to: zkToken0.self, amount: accountFee });
            feePayerUpdate.send({ to: zkToken1.self, amount: accountFee });
        });
        await txn.prove();
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey, zkToken1PrivateKey]).send();

        tokenHolder0 = new DexTokenHolder(zkAppAddress, zkToken0.deriveTokenId());
        tokenHolder1 = new DexTokenHolder(zkAppAddress, zkToken1.deriveTokenId());
        txn = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount, 3);
            await zkApp.deploy();
            await tokenHolder0.deploy();
            await tokenHolder1.deploy();
            await zkToken0.approveAccountUpdate(tokenHolder0.self);
            await zkToken1.approveAccountUpdate(tokenHolder1.self);
        });
        await txn.prove();
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey, zkToken1PrivateKey]).send();


        // mint token to user
        await mintToken(senderAccount);

    });

    it('add liquidity', async () => {

        let USER_DX = 1_000n;
        const txn = await Mina.transaction(senderAccount, async () => {
            AccountUpdate.fundNewAccount(senderAccount);
            await zkApp.supplyLiquidityBase(UInt64.from(USER_DX), UInt64.from(USER_DX));
        });
        console.log("add liquidity", txn.toPretty());
        await txn.prove();
        await txn.sign([senderKey]).send();


        const liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
        const expected = USER_DX + USER_DX;
        console.log("liquidity user", liquidityUser.toString());
        expect(liquidityUser.toBigInt()).toEqual(expected);
    });


    async function mintToken(user: PublicKey) {
        // update transaction
        const txn = await Mina.transaction(senderAccount, async () => {
            AccountUpdate.fundNewAccount(senderAccount, 2);
            await zkToken0.transfer(addresses.tokenX, user, UInt64.from(1000 * 10 ** 9));
            await zkToken1.transfer(addresses.tokenY, user, UInt64.from(1000 * 10 ** 9));
        });
        await txn.prove();
        await txn.sign([senderKey, zkToken0PrivateKey, zkToken1PrivateKey]).send();


    }

});