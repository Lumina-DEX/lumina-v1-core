import { Avatar, Loading, Table, Dropdown, Button } from "react-daisyui";
import clsx from "classnames";
import type { NextPageWithLayout } from "@/pages/_app.page";
import CurrencyFormat from "react-currency-format";
import { FaCaretDown } from "react-icons/fa";
import { useRouter } from "next/router";
import { LPToken, Token } from "@/types/token";

const ManageCard: NextPageWithLayout = () => {
  const router = useRouter();

  const tokens: (Token | LPToken)[] = [
    {
      id: "id_USDCxxxx",
      symbol: "USDC",
      icon: "/assets/tokens/usdc.png",
      type: "Token",
      usd_price: 1.0,
      price_change: 0.02,
      balance: 1.83,
    },
    {
      id: "id_USDCUSTSYxxxx",
      symbol: ["USDC", "USTSY"],
      icon: ["/assets/tokens/usdc.png", "/assets/tokens/ustsy.png"],
      type: "LP",
      usd_price: 1.25,
      price_change: -0.1,
      balance: 10.3,
    } as LPToken,
  ];

  const onSwapClick = (token: Token) => () => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("fromToken", token.symbol.toLowerCase());

    router.push({
      pathname: "/dash/swap",
      search: newSearchParams.toString(),
    });
  };

  const onSendClick = (token: Token) => () => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("token", token.symbol.toLowerCase());

    router.push({
      pathname: "/dash/send",
      search: newSearchParams.toString(),
    });
  };

  const onPoolClick = (token: Token) => () => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("fromToken", token.symbol.toLowerCase());

    router.push({
      pathname: "/dash/add",
      search: newSearchParams.toString(),
    });
  };

  const onManageClick = (lptoken: LPToken) => () => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("fromToken", lptoken.symbol[0].toLowerCase());
    newSearchParams.set("toToken", lptoken.symbol[1].toLowerCase());

    router.push({
      pathname: "/dash/add",
      search: newSearchParams.toString(),
    });
  };

  return (
    <div className="px-4">
      <div className="card font-metrophobic">
        <div className="flex flex-col gap-y-4 py-6">
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-2xl font-orbitron">Manage</h1>
          </div>
          <div className="hidden md:block">
            {tokens.length ? (
              <Table className="rounded-box px-8" zebra>
                <Table.Head className="text-base text-default">
                  <span>Name</span>
                  <span className="max-md:hidden">Type</span>
                  <span className="max-sm:hidden">Price</span>
                  <span>Value</span>
                  <span></span>
                </Table.Head>

                <Table.Body>
                  {tokens.map((token, index) => {
                    const type = token.type;
                    return (
                      <Table.Row key={index} className="text-disabled">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-3">
                            {type === "Token" && (
                              <>
                                <Avatar
                                  className="border-0"
                                  src={token.icon as string}
                                  shape="circle"
                                  size={30}
                                />
                                <span className="uppercase text-base">
                                  {token.symbol as string}
                                </span>
                              </>
                            )}
                            {type === "LP" && (
                              <>
                                <Avatar.Group className="overflow-visible">
                                  {(token.icon as string[]).map(
                                    (icon, index) => (
                                      <Avatar
                                        key={index}
                                        className="border-0"
                                        src={icon}
                                        shape="circle"
                                        size={30}
                                      />
                                    )
                                  )}
                                </Avatar.Group>
                                <span className="uppercase text-base">
                                  {(token.symbol as string[]).join(" / ")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col text-base">
                          <span>{token.type}</span>
                        </div>
                        <div className="flex flex-col text-base">
                          <CurrencyFormat
                            displayType="text"
                            className="font-secondary text-left text-base max-md:hidden"
                            thousandSeparator
                            decimalScale={2}
                            prefix="$"
                            value={token.usd_price}
                          />
                          <CurrencyFormat
                            displayType="text"
                            className={clsx(
                              "font-secondary text-left text-base max-md:hidden",
                              {
                                "text-green-500": token.price_change >= 0,
                                "text-red-500": token.price_change < 0,
                              }
                            )}
                            {...(token.price_change > 0 ? { prefix: "+" } : {})}
                            suffix="%"
                            value={token.price_change}
                          />
                        </div>
                        <div className="flex flex-col text-base">
                          <CurrencyFormat
                            displayType="text"
                            className="font-secondary text-left text-base max-md:hidden"
                            thousandSeparator
                            decimalScale={2}
                            prefix="$"
                            value={
                              Number(token.usd_price) * (token.balance || 0)
                            }
                          />
                          <CurrencyFormat
                            displayType="text"
                            className="font-secondary text-left text-base max-md:hidden"
                            decimalScale={2}
                            suffix={
                              token.type === "Token"
                                ? (token.symbol as string)
                                : "LP"
                            }
                            value={token.balance}
                          />
                        </div>
                        <div className="flex flex-col text-base">
                          <Dropdown end hover>
                            <Dropdown.Toggle>
                              Actions
                              <FaCaretDown />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="z-10 fixed w-[100px] rounded-md bg-light-100">
                              {token.type === "Token" && (
                                <>
                                  <Dropdown.Item
                                    className="py-1 justify-center"
                                    onClick={onSwapClick(token)}
                                  >
                                    Swap
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    className="py-1 justify-center"
                                    onClick={onSendClick(token)}
                                  >
                                    Send
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    className="py-1 justify-center"
                                    onClick={onPoolClick(token)}
                                  >
                                    Pool
                                  </Dropdown.Item>
                                </>
                              )}
                              {token.type === "LP" && (
                                <>
                                  <Dropdown.Item className="py-1 justify-center">
                                    Send
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    className="py-1 justify-center"
                                    onClick={onManageClick(token as LPToken)}
                                  >
                                    Manage
                                  </Dropdown.Item>
                                </>
                              )}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
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
          <div className="w-full flex justify-center">
            <Button
              className="h-[48px] min-h-0 shadow-md font-orbitron"
              color="primary"
              size="lg"
            >
              Create Token
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCard;
