import Layout from "@/components/Layout";
import React, { ReactElement, useState } from "react";
import CoinPriceChart from "./CoinPriceChart";
import SwapCard from "./SwapCard";
import useTokens from "@/states/useTokens";
import { Loading } from "react-daisyui";
import { Token } from "@/types/token";
import { useSearchParams } from "next/navigation";
import PriceViewCard from "./PriceViewCard";
function SwapPage() {
  const tokens = useTokens((state) => state.tokens);

  return (
    <div className="flex flex-col gap-y-12 container max-sm:mt-0">
      {tokens.length > 0 ? (
        <div className="w-full flex flex-row justify-between gap-x-10 max-lg:justify-center">
          <SwapCard />
          <PriceViewCard />
        </div>
      ) : (
        <Loading color="primary" />
      )}
    </div>
  );
}

SwapPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default SwapPage;
