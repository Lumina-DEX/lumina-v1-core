import { Field, Permissions, SmartContract, state, State, method, Struct, UInt64, PublicKey, Bool, Circuit, Provable, TokenContract, AccountUpdate, AccountUpdateForest, Reducer, Account, Experimental, Option, Int64, DeployArgs } from 'o1js';

export class TestToken extends TokenContract {

  init() {
    super.init();
    this.account.permissions.set({
      ...Permissions.default(),
      access: Permissions.proof(),
      send: Permissions.proofOrSignature(),
    });
    this.account.tokenSymbol.set("TT");
  }

  @method async approveBase(forest: AccountUpdateForest) {
    this.checkZeroBalanceChange(forest);
  }

  @method async mintTo(to: PublicKey, amount: UInt64) {
    this.internal.mint({ address: to, amount });
  }

}

