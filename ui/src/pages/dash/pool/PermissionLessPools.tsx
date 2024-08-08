import React, { useEffect, useState } from "react";
import SearchInput from "@/components/Input/SearchInput";
import CurrencyFormat from "react-currency-format";
import { Avatar, Table, Collapse, Loading, Button } from "react-daisyui";
import { Pool } from "@/types/pool";
import { BsCircle } from "react-icons/bs";
import Link from "next/link";
import { CgUnavailable } from "react-icons/cg";
import useAccount from "@/states/useAccount";
import useTokens from "@/states/useTokens";
import useLoad from "@/states/useLoad";
import { connect } from "@/lib/wallet";
interface Props {
  pools: Pool[];
}

const PermissionLessPools: React.FC<Props> = ({ pools }) => {
  const { address } = useAccount((state) => ({
    address: state.publicKeyBase58,
  }));

  const tokens = useTokens((state) => state.tokens);

  const { loadState } = useLoad((state) => ({
    loadState: state.state,
  }));

  const handleConnectWallet = async () => {
    connect();
  };

  return (
    <div className="flex flex-col gap-y-4 pt-4">
      <div className="text-center font-bold text-black px-4 text-base sm:text-lg min-[320px]:text-[15px]">
        Select an existing pool to manage liquidity or click ‘New Pool’
      </div>
      <div className="hidden md:block">
        {pools.length ? (
          <Table className="rounded-box px-8" zebra>
            <Table.Head className="text-base text-default">
              <div className="flex items-center gap-4">
                <span>Name</span>
                <SearchInput
                  className="bg-transparent font-secondary py-2 px-3 h-auto pr-8"
                  placeholder="Search"
                />
              </div>
              <span className="max-md:hidden">Your Liquidity</span>
              <span className="max-sm:hidden">Total Liquidity</span>
              <span>APR</span>
            </Table.Head>

            <Table.Body>
              {pools.map((pool, index) => {
                return (
                  <Table.Row key={index} className="text-disabled">
                    <div className="flex justify-between items-center">
                      <Link
                        href={`/dash/add?fromToken=${pool.from_token.symbol.toLowerCase()}&toToken=${pool.to_token.symbol.toLowerCase()}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar.Group className="overflow-visible">
                            <Avatar
                              className="border-0"
                              src={pool.from_token.icon}
                              shape="circle"
                              size={30}
                            />
                            <Avatar
                              className="border-0 translate-x-2"
                              src={pool.to_token.icon}
                              shape="circle"
                              size={30}
                            />
                          </Avatar.Group>
                          <span className="uppercase text-base">
                            {pool.from_token.symbol} / {pool.to_token.symbol}
                          </span>
                        </div>
                      </Link>
                    </div>
                    <CurrencyFormat
                      displayType="text"
                      className="font-secondary text-left text-base max-md:hidden"
                      thousandSeparator
                      decimalScale={2}
                      value={0}
                    />
                    <CurrencyFormat
                      displayType="text"
                      className="font-secondary text-left text-base max-sm:hidden"
                      thousandSeparator
                      decimalScale={2}
                      value={pool.total_liquidity}
                    />
                    <CurrencyFormat
                      displayType="text"
                      className="font-secondary text-left text-base"
                      decimalScale={2}
                      suffix="%"
                      value={pool.apr}
                    />
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        ) : (
          <div className="text-center">
            <Loading variant="dots" />
          </div>
        )}
      </div>

      <div className="block md:hidden">
        {pools.map((pool, index) => (
          <Collapse checkbox icon="arrow" key={index}>
            <Collapse.Title className="text-xl font-medium">
              <div className="flex items-center gap-3">
                <Avatar.Group className="overflow-visible">
                  <Avatar
                    className="border-0"
                    src={pool.from_token.icon}
                    shape="circle"
                    size={30}
                  />
                  <Avatar
                    className="border-0 translate-x-2"
                    src={pool.to_token.icon}
                    shape="circle"
                    size={30}
                  />
                </Avatar.Group>
                <span className="uppercase text-base">
                  {pool.from_token.symbol} / {pool.to_token.symbol}
                </span>
              </div>
            </Collapse.Title>
            <Collapse.Content>
              <div className="flex justify-between">
                <div>Your Liquidity</div>
                <CurrencyFormat
                  displayType="text"
                  className="font-secondary text-left text-base"
                  thousandSeparator
                  decimalScale={2}
                  value={0}
                />
              </div>
              <div className="flex justify-between">
                <div>Total Liquidity</div>
                <CurrencyFormat
                  displayType="text"
                  className="font-secondary text-left text-base"
                  thousandSeparator
                  decimalScale={2}
                  value={pool.total_liquidity}
                />
              </div>
              <div className="flex justify-between">
                <div>APR</div>
                <CurrencyFormat
                  displayType="text"
                  className="font-secondary text-left text-base"
                  decimalScale={2}
                  suffix="%"
                  value={pool.apr}
                />
              </div>
            </Collapse.Content>
          </Collapse>
        ))}
      </div>
      <div className="flex justify-center mb-4">
        {address ? (
          <Link
            href={`/dash/add?fromToken=${tokens[0].id}&toToken=${tokens[1].id}`}
            className="btn py-2 shadow-md btn-primary w-[160px] text-lg font-orbitron"
          >
            New Pool
          </Link>
        ) : (
          <Button
            className="btn-primary text-white font-orbitron"
            onClick={handleConnectWallet}
            disabled={!loadState}
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
  );
};

export default PermissionLessPools;
