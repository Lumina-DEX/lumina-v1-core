import React, { useState, useEffect } from "react";
import { MenuItems } from "@/constants/menu";
import ConnectWallet from "../Button/ConnectWallet";
import { Button, Drawer, Menu, Navbar } from "react-daisyui";
import Link from "next/link";
import Item from "@/components/Menu/item";

const Header = () => {
  const [visible, setVisible] = useState(false);

  const toggleVisible = () => {
    setVisible(!visible);
  };

  const drawerSide = (
    <Menu className="p-4 w-40 h-full bg-base-200 text-base-content bg-light-100 font-primary z-10">
      {MenuItems.map((item, index) => (
        <Menu.Item key={index} onClick={toggleVisible}>
          <Link href={item.link} className="font-bold focus:text-black ">
            {item.name}
          </Link>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className="fixed top-0 left-0 h-[64px] w-full z-[2] bg-white shadow-10 px-4">
      <Drawer
        side={drawerSide}
        open={visible}
        onClickOverlay={toggleVisible}
        className="font-sans"
      >
        <Navbar className="justify-between">
          <div className="hidden max-lg:flex">
            <Button shape="square" color="ghost" onClick={toggleVisible}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block w-6 h-6 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
            <div
              className="flex-1 mx-2 cursor-pointer w-52 h-12"
              style={{
                backgroundImage: "url(/assets/logo/logo.png)",
                backgroundSize: "cover",
              }}
              onClick={() => (window.location.href = "/")}
            ></div>
          </div>
          <div className="flex">
            <div
              className="block max-lg:hidden flex-1 mx-2 cursor-pointer w-52 h-12"
              style={{
                backgroundImage: "url(/assets/logo/logo.png)",
                backgroundSize: "cover",
              }}
              onClick={() => (window.location.href = "/")}
            ></div>
          </div>
          <div className="block max-lg:hidden">
            <Menu horizontal={true} className="flex flex-grow gap-6 ">
              {MenuItems.map((item, index) => (
                <Item
                  key={index}
                  link={item.link}
                  name={item.name}
                  target={item.name === "Enterprise" ? 1 : 0}
                />
              ))}
            </Menu>
          </div>
          <ConnectWallet />
        </Navbar>
      </Drawer>
    </div>
  );
};

export default Header;
