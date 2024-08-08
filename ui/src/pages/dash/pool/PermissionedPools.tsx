import React from "react";
import clsx from "classnames";
import SearchInput from "@/components/Input/SearchInput";
import CurrencyFormat from "react-currency-format";
import { Avatar, Table, Button, Collapse, Loading } from "react-daisyui";
import { Pool } from "@/types/pool";
import useAccount from "@/states/useAccount";
import { RxCircle, RxCircleBackslash } from "react-icons/rx";
import Link from "next/link";
import { connect } from "@/lib/wallet";
import useLoad from "@/states/useLoad";
interface Props {
  pools: Pool[];
}

const PermissionedPools: React.FC<Props> = ({ pools }) => {
  const {
    nationality,
    hasSideos,
    kycStarted,
    kycClaimed,
    kycJwt,
    kycVerified,
    kybVerified,
    address,
  } = useAccount((state) => ({
    nationality: state.nationality,
    hasSideos: state.hasSideos,
    kycStarted: state.kycStarted,
    kycClaimed: state.kycClaimed,
    kycJwt: state.kycJwt,
    kycVerified: state.kycVerified,
    kybVerified: state.kybVerified,
    address: state.publicKeyBase58,
  }));
  const { loadState } = useLoad((state) => ({
    loadState: state.state,
  }));

  const handleConnectWallet = async () => {
    connect();
  };

  const AllowIcon = () => <RxCircle className="text-emerald-400 text-base" />;
  const NotAllowIcon = () => (
    <RxCircleBackslash className="text-rose-500 text-base" />
  );

  const renderNotes = () => {
    if (kybVerified) {
      return "KYB Passed, Select an existing pool to manage liquidity or click ‘New Pool’";
    }
    if (kycVerified) {
      return "KYC Passed, view your access to permissioned liquidity pools below";
    }
    if (hasSideos && kycStarted && kycClaimed !== "CLAIMED") {
      return "Claim Credential to access permissioned liquidity on Lumina";
    }
    if (address) {
      return "Complete KYC to access permissioned liquidity on Lumina";
    }
    return "Connect Wallet and Complete KYC to access permissioned liquidity on Lumina";
  };

  const renderAction = () => {
    if (kybVerified) {
      return (
        <Link
          href={`/dash/pool/new`}
          className="btn py-2 shadow-md btn-primary w-[160px] text-lg font-orbitron"
        >
          New Pool
        </Link>
      );
    }
    if (kycVerified) {
      return (
        <Link
          href={`/dash/kyb?address=${address}`}
          className="btn py-2 shadow-md btn-primary w-[160px] text-lg font-orbitron"
        >
          Start KYB
        </Link>
      );
    }
    if (hasSideos && kycStarted && kycClaimed !== "CLAIMED") {
      return (
        <Button
          id="dawOfferCredential"
          data-jwt={kycJwt}
          className="btn-primary text-white font-orbitron"
        >
          Claim Credential
        </Button>
      );
    }
    if (address) {
      return (
        <Link
          href={`/dash/kyc?address=${address}`}
          className="btn py-2 shadow-md btn-primary w-[160px] text-lg font-orbitron"
        >
          Start KYC
        </Link>
      );
    }
    return (
      <Button
        className="btn-primary text-white font-orbitron"
        onClick={handleConnectWallet}
        disabled={!loadState}
      >
        Connect Wallet
      </Button>
    );
  };

  return (
    <div className="flex flex-col gap-y-4 py-4">
      <div className="text-center font-bold text-black px-4 text-base sm:text-lg min-[320px]:text-[15px]">
        {renderNotes()}
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
                const restricted: boolean = kycVerified
                  ? (nationality === "US" && !pool.US) ||
                    (nationality !== "US" && pool.US)
                  : true;

                const swapEligible: boolean = true;
                const poolEligible: boolean = kybVerified;

                return (
                  <Table.Row key={index} className="text-disabled">
                    <div className="flex justify-between items-center">
                      <Link
                        href={`/dash/add?fromToken=${pool.from_token.symbol.toLowerCase()}&toToken=${pool.to_token.symbol.toLowerCase()}`}
                        className={clsx({
                          "pointer-events-none": restricted || !kybVerified,
                        })}
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
                      <div className="flex flex-row gap-x-2 flex-wrap justify-end max-w-[128px]">
                        {restricted ? (
                          <div className="flex flex-row items-center gap-x-1">
                            <NotAllowIcon />
                            Restricted
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-row items-center gap-x-1">
                              {swapEligible ? <AllowIcon /> : <NotAllowIcon />}
                              Swap
                            </div>
                            <div className="flex flex-row items-center gap-x-1">
                              {poolEligible ? <AllowIcon /> : <NotAllowIcon />}
                              Pool
                            </div>
                          </>
                        )}
                      </div>
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
        {pools.map((pool, index) => {
          const restricted: boolean = kycVerified
            ? (nationality === "US" && !pool.US) ||
              (nationality !== "US" && pool.US)
            : false;

          const swapEligible: boolean = true;
          const poolEligible: boolean = kybVerified;

          return (
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
                <div className="flex flex-row gap-x-2">
                  {restricted ? (
                    <div className="flex flex-row items-center gap-x-1">
                      <NotAllowIcon />
                      Restricted
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-row items-center gap-x-1">
                        {swapEligible ? <AllowIcon /> : <NotAllowIcon />}
                        Swap
                      </div>
                      <div className="flex flex-row items-center gap-x-1">
                        {poolEligible ? <AllowIcon /> : <NotAllowIcon />}
                        Pool
                      </div>
                    </>
                  )}
                </div>
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
          );
        })}
      </div>

      {!kybVerified && kycVerified && (
        <div className="text-center font-bold text-black px-2 text-base sm:text-base min-[320px]:text-[13px]">
          Permissioned pool creation and management is
          <br /> reserved for institutions that have completed KYB
        </div>
      )}

      <div className="flex justify-center">{renderAction()}</div>
    </div>
  );
};

export default PermissionedPools;
