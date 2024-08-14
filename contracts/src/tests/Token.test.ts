import { Account, AccountUpdate, Bool, fetchAccount, Field, Mina, PrivateKey, PublicKey, TokenContract, UInt64 } from 'o1js';

import { TokenBalance } from '../TokenBalance';

let proofsEnabled = true;

describe('Pool', () => {
    let deployerAccount: Mina.TestPublicKey,
        deployerKey: PrivateKey,
        senderAccount: Mina.TestPublicKey,
        senderKey: PrivateKey,
        bobAccount: Mina.TestPublicKey,
        bobKey: PrivateKey,
        aliceAccount: Mina.TestPublicKey,
        aliceKey: PrivateKey,
        zkToken0Address: PublicKey,
        zkToken0PrivateKey: PrivateKey,
        zkToken0: TokenBalance;

    beforeEach(async () => {
        const Local = await Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        [deployerAccount, senderAccount, bobAccount, aliceAccount] = Local.testAccounts;
        deployerKey = deployerAccount.key;
        senderKey = senderAccount.key;
        bobKey = bobAccount.key;
        aliceKey = aliceAccount.key;

        zkToken0PrivateKey = PrivateKey.fromBase58("EKDysL7EQfb5ihJT55621BFNBwnyifz6foLkK1HQp2WMUUs54M2Q");
        zkToken0Address = zkToken0PrivateKey.toPublicKey();
        zkToken0 = new TokenBalance(zkToken0Address);

        if (proofsEnabled) {
            console.time('compile token');
            await TokenBalance.compile();
            console.timeEnd('compile token');
        }


        const txn = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount, 1);
            await zkToken0.deploy();
        });
        await txn.prove();
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn.sign([deployerKey, zkToken0PrivateKey]).send();

        // mint token to user
        await mintToken(senderAccount);

    });

    it('get balance', async () => {
        const bal = await zkToken0.getBalanceOf(senderAccount);
        const amt = UInt64.from(1000 * 10 ** 9);
        expect(bal.value).toEqual(amt.value);
    });


    async function mintToken(user: PublicKey) {
        // update transaction
        const txn = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount, 1);
            await zkToken0.mintTo(user, UInt64.from(1000 * 10 ** 9));
        });
        await txn.prove();
        await txn.sign([deployerKey, zkToken0PrivateKey]).send();


    }

});