import "@/styles/globals.css";
import type { AppProps } from "next/app";

import "../lib/reactCOIServiceWorker";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Session, SessionContextProvider } from "@supabase/auth-helpers-react";
import { ReactElement, ReactNode, useState } from "react";
import { Database } from "@/lib/database.types";
import { NextPage } from "next";
import Updaters from "@/updaters";
import Head from "next/head";
import useAccount from "@/states/useAccount";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export default function App({
  Component,
  pageProps,
}: AppProps & {
  Component: NextPageWithLayout;
  initialSession: Session;
}) {
  //const [supabase] = useState(() => createPagesBrowserClient<Database>());
  const getLayout = Component.getLayout ?? ((page) => page);
  const { risking } = useAccount((state) => ({
    risking: state.risking,
  }));

  return (
    <>
      <Head>
        <title>Lumina DEX</title>
      </Head>
      <div>
        {getLayout(
          risking && (risking.risk === "High" || risking.risk === "Severe") ? (
            <span className="text-4xl text-red-500 font-bold">
              You are blocked!
            </span>
          ) : (
            <Component {...pageProps} />
          )
        )}
        <Updaters />
      </div>
    </>
  );
}
