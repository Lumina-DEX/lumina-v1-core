import useAccount from "@/states/useAccount";

export const mina = typeof window !== "undefined" && (window as any)?.mina;

export const MINA_SUB_DECIMAL: number = 1e9;
const WALLET_CONNECTED_BEFORE_FLAG: string = "wallet_connected_before";

export async function connect() {
  if (!mina) return;
  await requestNetwork();
  await requestAccounts();

  typeof window !== "undefined" &&
    window.localStorage.setItem(WALLET_CONNECTED_BEFORE_FLAG, "true");

  mina.on("accountsChanged", requestAccounts);
  mina.on("chainChanged", requestNetwork);
}

export async function disconnect() {
  useAccount.setState(() => ({
    balances: {},
    hasBeenSetup: false,
    publicKeyBase58: null,
    kycVerified: false,
  }));
}

async function requestNetwork() {
  await mina
    .requestNetwork()
    .then(handleChainChanged)
    .catch((e: any) => console.error(e));
}

async function handleChainChanged(newChain: string) {
  useAccount.setState(() => ({ network: newChain }));
}

async function requestAccounts() {
  await mina
    .requestAccounts()
    .then(handleAccountsChanged)
    .catch((e: any) => console.error(e));
}

async function handleAccountsChanged(accounts: string[]) {
  let publicKeyBase58: string = "";
  let walletConnected: boolean = false;

  if (accounts?.length > 0) {
    publicKeyBase58 = accounts[0];
    await setupWorkerClient(publicKeyBase58);
    walletConnected = true;
  } else {
    typeof window !== "undefined" &&
      window.localStorage.setItem(WALLET_CONNECTED_BEFORE_FLAG, "false");
  }
  useAccount.setState(() => ({
    publicKeyBase58,
  }));
}

async function setupWorkerClient(publicKeyBase58: string) {
  try {
    const state = useAccount.getState();
    // check if connected user account exists or not
    const res = await state.zkappWorkerClient!.fetchAccount({
      publicKeyBase58,
    });
    const accountExists = !res.error;
    useAccount.setState((state) => ({ accountExists }));

    // get account balance if account exists
    if (accountExists) {
      const balance = await state.zkappWorkerClient!.getBalance(
        publicKeyBase58
      );
      useAccount.setState((state) => ({
        ...state,
        balances: { mina: Number(balance.toString()) / MINA_SUB_DECIMAL },
      }));
    } else {
      throw res;
    }
  } catch (e: any) {
    console.error("setupWorkerClient", e);
  }
}
