import React, { useState } from "react";
import { Token } from "@/types/token";
import { BsChevronDown } from "react-icons/bs";
import TokenSelecterModal from "@/components/Modal/TokenSelecterModal";

interface Props {
  token: Token | undefined;
  setToken: (token: Token) => void;
}

const TokenSelector: React.FC<Props> = ({ token, setToken }) => {
  const [visible, setVisible] = useState(false);
  const openModal = () => {
    setVisible(!visible);
  };

  const showModal = (visible: boolean) => {
    setVisible(visible);
  };

  const setCurToken = (token: Token) => {
    setToken(token);
  };

  return (
    <>
      <div
        className="flex h-8 bg-opacity-9 rounded-lg cursor-pointer"
        onClick={openModal}
      >
        {token && (
          <div className="flex-none grid w-8 justify-items-center items-center mr-2">
            <div
              className="w-8 h-8 bg-no-repeat bg-contain"
              style={{ backgroundImage: `url(${token.icon})` }}
            />
          </div>
        )}
        <div className="flex flex-row items-center">
          <div className="text-black text-xl">
            {token?.symbol || "Select Token"}
          </div>
          <div className="pl-2">
            <BsChevronDown />
          </div>
        </div>
      </div>
      <TokenSelecterModal
        visible={visible}
        showModal={showModal}
        setCurToken={setCurToken}
        token={token}
      />
    </>
  );
};

export default TokenSelector;
