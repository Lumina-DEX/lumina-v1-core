import Layout from "@/components/Layout";
import { Tabs } from "react-daisyui";
import { ReactElement, useEffect, useState } from "react";
import clsx from "classnames";
import PermissionedPools from "./PermissionedPools";
import PermissionLessPools from "./PermissionLessPools";
import type { NextPageWithLayout } from "@/pages/_app.page";
import useSupabaseFunctions from "@/services/supabase";
import useMockFunctions from "@/services/mock";

const PoolPage: NextPageWithLayout = () => {
  const [pools, setPools] = useState<any[]>([]);
  const { getPools } = useMockFunctions();

  useEffect(() => {
    getPools().then((response) => {
      const { status, data } = response;
      if (status === 200 && data) {
        setPools(data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tabValue, setTabValue] = useState(0);

  return (
    <div className="px-4">
      <div className="card font-metrophobic">
        <div
          className={clsx(
            "flex justify-between items-center rounded-t-[18px]",
            {
              "bg-light-100": tabValue === 1,
              "bg-light-200": tabValue !== 1,
            }
          )}
        >
          <Tabs
            size="lg"
            value={tabValue}
            onChange={setTabValue}
            className="flex-nowrap"
          >
            <Tabs.Tab
              style={{ lineHeight: "8px" }}
              className={clsx("font-orbitron rounded-tl-[18px]  pr-16 py-7", {
                "text-primary text-lg bg-light-100 md:text-lg": tabValue === 0,
                "text-default text-lg bg-light-200 md:text-lg": tabValue !== 0,
              })}
              value={0}
            >
              Public
            </Tabs.Tab>
            <Tabs.Tab
              style={{ lineHeight: "8px" }}
              className={clsx(
                "font-orbitron rounded-t-[18px] ml-[-10px] py-7 leading-[8px]",
                {
                  "text-primary  text-lg bg-light-100 md:text-lg":
                    tabValue === 1,
                  "text-default text-lg  bg-light-200 md:text-lg":
                    tabValue !== 1,
                }
              )}
              value={1}
            >
              Permissioned
            </Tabs.Tab>
          </Tabs>
        </div>
        <div className="w-full">
          {tabValue === 0 && <PermissionLessPools pools={pools} />}
          {tabValue === 1 && <PermissionedPools pools={pools} />}
        </div>
      </div>
    </div>
  );
};

PoolPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default PoolPage;
