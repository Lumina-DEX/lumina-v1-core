import Layout from "@/components/Layout";
import { NextPageWithLayout } from "@/pages/_app.page";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { ReactElement, useEffect } from "react";
import AddLiquidityStep from "./AddLiquidityStep";
import SwapParamsStep from "./SwapParamsStep";
import SwapPermsStep from "./SwapPermsStep";
import PoolPermsStep from "./PoolPermsStep";
import OtherSettingsStep from "./OtherSettingsStep";

const NewPoolPage: NextPageWithLayout = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step: string = searchParams.get("step") || "add";
  const Steps: Record<string, string> = {
    add: "Add Liquidity",
    swap_params: "Swap Parameters",
    swap_perms: "Swap Permissions",
    pool_perms: "Pool Permissions",
    other: "Other Settings",
  };

  useEffect(() => {
    if (!step) {
      const newSearchParams = new URLSearchParams();
      newSearchParams.set("step", "add");
      router.push({ search: newSearchParams.toString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleNextStep = (nextStep: string) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("step", nextStep);
    router.push({ search: newSearchParams.toString() });
  };

  const handleSubmit = () => {
    //
  };

  return (
    <>
      <div className="w-full p-8 pb-2">
        <div className="flex flex-col w-full gap-4">
          <h3 className="text-primary text-xl font-semibold text-center">
            Create Permissioned Pool
          </h3>
          <span>
            Step {Object.keys(Steps).indexOf(step) + 1}: {Steps[step]}
          </span>
        </div>
      </div>

      {(() => {
        switch (step) {
          case "add":
          default:
            return (
              <AddLiquidityStep
                onSubmit={() => handleNextStep("swap_params")}
              />
            );
          case "swap_params":
            return (
              <SwapParamsStep onSubmit={() => handleNextStep("swap_perms")} />
            );
          case "swap_perms":
            return (
              <SwapPermsStep onSubmit={() => handleNextStep("pool_perms")} />
            );
          case "pool_perms":
            return <PoolPermsStep onSubmit={() => handleNextStep("other")} />;
          case "other":
            return <OtherSettingsStep onSubmit={handleSubmit} />;
        }
      })()}
    </>
  );
};

NewPoolPage.getLayout = function getLayout(page: ReactElement) {
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

export default NewPoolPage;
