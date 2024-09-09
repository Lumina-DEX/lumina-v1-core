import { Field, SmartContract, state, State, method, Permissions, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, Account, Bool, Reducer, VerificationKey } from 'o1js';
import { PoolMina, FungibleToken, mulDiv, SwapEvent } from './indexmina.js';


export interface FaucetDeployProps extends Exclude<DeployArgs, undefined> {
    amount: UInt64;
    token: PublicKey;
}


export class Faucet extends SmartContract {

    @state(UInt64) amount = State<UInt64>();
    @state(PublicKey) token = State<PublicKey>();

    async deploy(args: FaucetDeployProps) {
        await super.deploy(args);
        args.amount.assertGreaterThan(UInt64.zero, "Put a default amount");
        this.amount.set(args.amount);
        args.token.isEmpty().assertFalse("Token empty");
        this.token.set(args.token);

        const token = new FungibleToken(args.token);
        token.deriveTokenId().assertEquals(this.tokenId, "Incorrect token address");

        this.account.permissions.set({
            ...Permissions.default(),
            send: Permissions.proof(),
            setVerificationKey: Permissions.VerificationKey.none(),
            setPermissions: Permissions.impossible()
        });
    }

    async claim() {
        const tokenAddress = this.token.getAndRequireEquals();
        const token = new FungibleToken(tokenAddress);
        const sender = this.sender.getUnconstrained();
        const accountSender = AccountUpdate.create(sender, token.deriveTokenId());
        // user can claim only if he is never received this token
        accountSender.account.provedState.requireEquals(Bool(false));
        const amount = this.amount.getAndRequireEquals();

        const accountUpdate = this.send({ to: sender, amount });
        accountUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
    }

}
