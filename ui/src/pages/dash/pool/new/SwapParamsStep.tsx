import clsx from "classnames";
import { useState } from "react";
import { Button, Input, Select } from "react-daisyui";

interface Props {
  onSubmit: () => void;
}
const SwapParamsStep: React.FC<Props> = ({ onSubmit }) => {
  const Fees = [0.05, 0.1, 0.25];
  const [swapFee, setSwapFee] = useState<string | number>("0.0");
  const [curve, setCurve] = useState("");

  return (
    <div className="w-full p-8 pt-0 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-black text-lg">
          Swap Fee for Liquidity Providers (%)
        </span>

        <div className="w-full flex gap-4">
          {Fees.map((fee, index) => (
            <Button
              key={index}
              className={clsx("font-metrophobic", "flex-1", {
                "bg-violet-200": Number(swapFee) === fee,
              })}
              shape="square"
              size="sm"
              onClick={() => setSwapFee(fee)}
            >
              {fee}%
            </Button>
          ))}
          <Input
            size="sm"
            placeholder={""}
            bordered={false}
            value={swapFee}
            onChange={(e) => setSwapFee(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-black text-lg">Pricing Curve</span>
        <Select
          size="md"
          value={curve}
          onChange={(event) => setCurve(event.target.value)}
        >
          <option value={""} disabled>
            Select Pricing Curve
          </option>
          <option value={"AMM"}>AMM</option>
          <option value={"CPMM"}>CPMM</option>
        </Select>
      </div>

      <div className="w-full flex justify-center">
        <Button
          className="w-1/2 shadow-md text-white"
          size="md"
          color="primary"
          onClick={onSubmit}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
};

export default SwapParamsStep;
