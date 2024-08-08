import Layout from "@/components/Layout";
import { NextPageWithLayout } from "@/pages/_app.page";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { ReactElement, useEffect, useState } from "react";
import { mina } from "@/lib/wallet";
import useAccount from "@/states/useAccount";
import {
  SendTransactionResult,
  ProviderError,
} from "@aurowallet/mina-provider";
const DeployPoolPage: NextPageWithLayout = () => {
  const [tokenX, setTokenX] = useState("");
  const [tokenY, setTokenY] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const stateAccount = useAccount();

  const handleSubmit = async () => {
    //
    try {
      setStatus("Create transaction");
      setLoading(true);
      const data = { tokenX, tokenY };
      const call = await fetch("/api/pool", {
        body: JSON.stringify(data),
        method: 'POST',
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      const result = await call.json();

      console.log("result", result);

      setLoading(false);
    } catch (error) {
      setStatus("Error check console");
      console.error(error);
    }
  };

  return (
    <>
      <div className="w-full p-8 pb-2">
        <div className="flex flex-col w-full gap-4">
          <h3 className="text-primary text-xl font-semibold text-center">
            Create Permisionless Pool
          </h3>
        </div>
      </div>

      <div>
        <input type="text"
          defaultValue={tokenX}
          value={tokenX}
          onChange={(event) => setTokenX(event.target.value)}
          placeholder="Token X address"></input>
        <input type="text" defaultValue={tokenY}
          value={tokenY}
          onChange={(event) => setTokenY(event.target.value)}
          placeholder="Token Y address"></input>
      </div>
      <div>
        {!loading ?
          <button onClick={() => handleSubmit()}>Deploy</button>
          :
          <span>{status}</span>
        }
      </div>
    </>
  );
};

DeployPoolPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      <div className="px-4">
        <div className="card font-metrophobic bg-light-100 w-[470px] overflow-hidden max-[500px]:w-[400px] max-[420px]:w-[300px]">
          {page}
        </div>
      </div>
    </Layout>
  );
};

export default DeployPoolPage;
