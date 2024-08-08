import useAccount from "@/states/useAccount";
import useTokens from "@/states/useTokens";
import { Token } from "@/types/token";
import React, { useEffect, useState } from "react";
import { Input, Modal } from "react-daisyui";
import { FaRegEdit } from "react-icons/fa";

interface Props {
  visible: boolean;
  showModal: (visible: boolean) => void;
  setCurToken: (token: Token) => void;
  token: Token | undefined;
}

const TokenSelecterModal = (props: Props) => {
  const tokens = useTokens((state) => state.tokens);
  const [visible, setVisible] = useState<boolean>(false);
  const [searchTokens, setSearchTokens] = useState(tokens);
  const balances = useAccount((state) => state.balances);

  useEffect(() => {
    setVisible(props.visible);
    setSearchTokens(tokens.filter((token: Token) => token !== props.token));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  const toggleExit = () => {
    props.showModal(false);
  };

  const searchToken = (val: string) => {
    const result = tokens.filter((token) => token.symbol.search(val) >= 0);
    setSearchTokens(result);
  };

  const setCurrentToken = (token: Token) => {
    props.setCurToken(token);
    props.showModal(false);
  };

  return (
    <div className="text-left">
      <Modal.Legacy
        open={visible}
        onClickBackdrop={toggleExit}
        className="bg-light-200"
      >
        <Modal.Header className="font-bold mb-4">Select a token</Modal.Header>
        <Modal.Body>
          <div className="flex">
            <Input
              autoFocus={true}
              placeholder="Search Token Name"
              className="w-full rounded-2xl"
              onChange={(e) => searchToken(e.target.value)}
            />
          </div>
          <div className="border-y border-slate-300 mt-4 h-[450px] overflow-y-scroll">
            {searchTokens.map((token, index) => (
              <div
                className="flex hover:bg-light-100 cursor-pointer justify-between pr-2"
                key={index}
                onClick={() => setCurrentToken(token)}
              >
                <div className="flex">
                  <div className="flex-none grid w-12 justify-items-center items-center">
                    <div
                      className="w-8 h-8 bg-no-repeat bg-contain"
                      style={{ backgroundImage: `url(${token.icon})` }}
                    ></div>
                  </div>
                  <div className="grow grid content-between px-2">
                    <div className="text-black text-xl">{token.symbol}</div>
                    <div className="text-gray text-xs">MINA</div>
                  </div>
                </div>
                <div>{balances[token!.symbol.toLowerCase()] || 0}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-4">
            <div className="flex flex-row cursor-pointer items-center">
              <FaRegEdit size={20} /> &nbsp;
              <div> Manage</div>
            </div>
          </div>
        </Modal.Body>
      </Modal.Legacy>
    </div>
  );
};

export default TokenSelecterModal;
