import useAccount from "@/states/useAccount";
import { PublicKey } from "o1js";
import ZkappWorkerClient from "@/lib/zkappWorkerClient";
import { useEffect } from "react";
import useLoad from "@/states/useLoad";
import useSupabaseFunctions from "@/services/supabase";
import useMockFunctions from "@/services/mock";

export default function AccountUpdater() {
  const { getRisk, saveRisk } = useMockFunctions();
  const { address, hasBeenSetup, accountUpdate } = useAccount((state) => ({
    address: state.publicKeyBase58,
    hasBeenSetup: state.hasBeenSetup,
    accountUpdate: state.update,
  }));

  const { loadUpdate } = useLoad((state) => ({
    loadUpdate: state.update,
  }));

  useEffect(() => {
    async function timeout(seconds: number): Promise<void> {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, seconds * 1000);
      });
    }

    (async () => {
      if (!hasBeenSetup) {
        loadUpdate({ msg: "Loading web worker...", process: 0 });
        const zkappWorkerClient = new ZkappWorkerClient();
        await timeout(5);

        loadUpdate({ msg: "Done loading web worker", process: 0.25 });
        await timeout(5);

        await zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;
        const DAW = (window as any).DAW;

        // if (!mina) {
        //   accountUpdate({ hasWallet: false });
        //   loadUpdate({
        //     msg: `<a href="https://www.aurowallet.com/" target="_blank" rel="noreferrer">Install Auro wallet</a>`,
        //     process: 0.6,
        //   });
        //   return;
        // }

        await zkappWorkerClient.loadContract();

        loadUpdate({ msg: "Compiling zkApp...", process: 0.5 });
        await zkappWorkerClient.compileContract();
        loadUpdate({ msg: "zkApp compiled...", process: 0.75 });
        await timeout(5);

        const zkappPublicKey = PublicKey.fromBase58(
          "B62qjBPtgWypGa5W6kwdUFhH5WKRKVb3UJPXVGhrkPz28juJriPpf3u"
        );

        await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        accountUpdate({
          zkappWorkerClient,
          hasWallet: !!mina,
          hasSideos:
            DAW && "extensionInstalled" in DAW && DAW.extensionInstalled,
          hasBeenSetup: true,
          publicKey: null,
          publicKeyBase58: "",
          zkappPublicKey,
          accountExists: false,
        });
        loadUpdate({ state: true, process: 1 });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Risk
  useEffect(() => {
    if (address) {
      (async () => {
        try {
          const response = await getRisk(address);

          if (response.status !== 200) {
            throw new Error("");
          }

          const risk = response.data;

          if (!risk) {
            console.error("No risk score in database");
          } else {
            const { info } = risk;
            const body = JSON.parse(info!);

            accountUpdate({ risking: body });
            return;
          }
        } catch (error) {
          console.error("getRisk", error);
        }
        try {
          const { message } = await fetch("/api/chainalysis/register", {
            method: "POST",
            body: JSON.stringify({ address }),
          }).then((response) => response.json());

          if (message !== "Success") {
            throw new Error("Failed");
          }
        } catch (error) {
          console.error("/api/chainalysis/register", error);
          return;
        }
        try {
          const { body } = await fetch("/api/chainalysis/retrieve", {
            method: "POST",
            body: JSON.stringify({ address }),
          }).then((response) => response.json());

          await saveRisk(address, body.risk, JSON.stringify(body));

          accountUpdate({ risking: body });
        } catch (error) {
          console.error("/api/chainalysis/retrieve", error);
        }
      })();
    }
  }, [address, accountUpdate, getRisk, saveRisk]);

  return null;
}
