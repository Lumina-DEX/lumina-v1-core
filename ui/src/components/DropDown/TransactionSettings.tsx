import useTokens from "@/states/useTokens";
import React, { useState } from "react";
import { BiQuestionMark } from "react-icons/bi";
import { AiFillWarning } from "react-icons/ai";
import { Button, Card, Dropdown, Tooltip, Input } from "react-daisyui";
import clsx from "classnames";

interface Props {
  setSlippagePercent: (percent: number | string) => void;
}

interface SlippagePercent {
  placeholder: string;
  percent: string | number;
  failVisible: boolean;
  errorMsg: string;
  color: string;
  btnClick: boolean;
  warningVisible: boolean;
}

const percents = [0.1, 0.5, 1];

const TransactionSettings = (props: Props) => {
  const tokens = useTokens((state) => state.tokens);

  const [customPercent, setCustomPercent] = useState<SlippagePercent>({
    placeholder: "11.00",
    failVisible: false,
    errorMsg: "",
    percent: "",
    color: "text-orange-400",
    btnClick: false,
    warningVisible: false,
  });

  const setPercentBtn = (percent: number) => {
    let errorMsg: string;
    let color: string;
    let failVisible: boolean;
    if (percent === 0.1) {
      errorMsg = "Your transaction may fail";
      color = "text-orange-400";
      failVisible = true;
    }
    props.setSlippagePercent(percent);
    setCustomPercent((pre) => ({
      ...pre,
      placeholder: percent + "",
      failVisible: failVisible,
      percent: percent,
      btnClick: true,
      errorMsg: errorMsg,
      color: color,
      warningVisible: false,
    }));
  };

  const setPercent = (percent: number | string) => {
    let failVisible: boolean;
    let errorMsg: string;
    let color: string;
    let warningVisible: boolean;
    let slippagePercnet: string | number;

    slippagePercnet = percent;
    if (isNaN(Number(percent))) {
      failVisible = true;
      errorMsg = "Enter a valid percentage";
      color = "text-error";
      slippagePercnet = "Invalid";
    } else {
      if (Number(percent) < 0.5 && percent !== "") {
        errorMsg = "Your transaction may fail";
        color = "text-orange-400";
        failVisible = true;
        warningVisible = true;
      }
      if (Number(percent) > 5) {
        errorMsg = "Your transaction may be frontrun";
        color = "text-orange-400";
        failVisible = true;
        warningVisible = true;
      }
      if (Number(percent) >= 50) {
        errorMsg = "Enter a valid percentage";
        color = "text-error";
        failVisible = true;
        warningVisible = false;
        slippagePercnet = "Invalid";
      }
    }
    slippagePercnet = Number(slippagePercnet);
    props.setSlippagePercent(
      isNaN(slippagePercnet) ? "Invalid" : slippagePercnet
    );
    setCustomPercent((pre) => ({
      ...pre,
      failVisible: failVisible,
      percent: percent,
      errorMsg: errorMsg,
      color: color,
      btnClick: false,
      warningVisible: warningVisible,
    }));
  };

  return (
    <div className="text-left">
      <Dropdown.Menu className="card card-compact w-72 p-1 shadow text-primary-content m-1 bg-light-200">
        <Card.Body className="text-black font-sans">
          <p>Transaction Settings</p>
          <div className="flex items-center">
            <span>Slippage tolerance </span>
            <Tooltip
              color="neutral"
              position="bottom"
              message="Your transaction will revert if the price changes unfavorably by more than this percentage."
            >
              <BiQuestionMark />
            </Tooltip>
          </div>
          <div className="flex justify-between">
            {percents.map((percent, index) => (
              <Button
                key={index}
                className={clsx("px-6", {
                  "bg-violet-200": Number(customPercent.percent) === percent,
                })}
                shape="square"
                size="sm"
                onClick={() => setPercentBtn(percent)}
              >
                {percent}%
              </Button>
            ))}
            <div className="relative">
              <Input
                className={clsx(
                  "w-[80px] h-[30px] text-base text-right px-[20px]",
                  {
                    "border-rose-600":
                      customPercent.errorMsg == "Enter a valid percentage",
                  }
                )}
                size="xs"
                placeholder={customPercent.placeholder}
                value={customPercent.btnClick ? "" : customPercent.percent}
                onChange={(e) => setPercent(e.target.value)}
              ></Input>
              <span className="font-bold absolute right-1 top-1.5">%</span>
              <span
                className={clsx(
                  "font-bold absolute left-1 top-2 text-orange-400 ",
                  {
                    invisible: !customPercent.warningVisible,
                    visible: customPercent.warningVisible,
                  }
                )}
              >
                <AiFillWarning />
              </span>
            </div>
          </div>
          <div className="font-bold">
            <p
              className={clsx(customPercent.color, {
                invisible: !customPercent.failVisible,
                visible: customPercent.failVisible,
              })}
            >
              {customPercent.errorMsg}
            </p>
          </div>
        </Card.Body>
      </Dropdown.Menu>
    </div>
  );
};

export default TransactionSettings;
