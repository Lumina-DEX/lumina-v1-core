import React, { PropsWithChildren, useState, useEffect } from "react";
import Header from "../Header";
import LoadingState from "../LoadingState";
import Footer from "../Footer";
import { AppContext } from "@/contexts/AppContext";
import { LoadingContext } from "@/contexts/LoadingContext";
import useSupabaseFunctions from "@/services/supabase";
import useTokens from "@/states/useTokens";
import { Token } from "@/types/token";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const [isLoading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const { getTokens } = useSupabaseFunctions();
  const { updateTokens } = useTokens((state) => ({
    updateTokens: state.update,
  }));

  useEffect(() => {
    window.addEventListener("passive", function (event) {
      event.preventDefault();
    });

    getTokens().then((response) => {
      const { status, data } = response;
      if (status === 200 && data) {
        updateTokens(data.map((v) => ({ ...v, type: "Token" } as Token)));
      }
    });
  }, [getTokens, updateTokens]);

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode }}>
      <LoadingContext.Provider
        value={{ isLoading, setLoading, loadingMessage, setLoadingMessage }}
      >
        <Header />
        <LoadingState />
        <div className="absolute w-full min-h-screen h-auto flex flex-col items-center justify-center bg-lumina bg-cover bg-no-repeat overflow-x-hidden py-40 px-2">
          {children}
        </div>
        <Footer />
      </LoadingContext.Provider>
    </AppContext.Provider>
  );
};

export default Layout;
