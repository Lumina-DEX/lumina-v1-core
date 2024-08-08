import { Tabs } from "react-daisyui";
import clsx from "classnames";
import { useState } from "react";
import SwapPanel from "./SwapPanel";
import LeaderboardPanel from "./LeaderboardPanel";

function SwapCard() {
  const [tabValue, setTabValue] = useState(0);

  return (
    <div className="bg-light-200 card w-[400px] h-[500px] overflow-hidden max-[420px]:w-[300px]">
      <Tabs
        className="w-full"
        variant="lifted"
        size="lg"
        value={tabValue}
        onChange={setTabValue}
      >
        <Tabs.Tab
          className={clsx("!border-0 grow", {
            "text-primary": tabValue === 0,
            "text-disabled": tabValue !== 0,
          })}
          value={0}
        >
          Swap
        </Tabs.Tab>
        <Tabs.Tab
          className={clsx("!border-0 grow", {
            "text-primary": tabValue === 1,
            "text-disabled": tabValue !== 1,
          })}
          value={1}
        >
          Leaderboard
        </Tabs.Tab>
      </Tabs>

      {tabValue === 0 && <SwapPanel />}
      {tabValue === 1 && <LeaderboardPanel />}
    </div>
  );
}

export default SwapCard;
