import { NextUIProvider } from "@nextui-org/react";
import DynamicProvider from "./DynamicProvider.jsx";
import AuthProvider from "./AuthProvider.jsx";
import Web3Provider from "./Web3Provider.jsx";
import QIEWalletProvider from "./QIEWalletProvider.jsx";
import { SWRConfig } from "swr";
import UserProvider from "./UserProvider.jsx";

export default function RootProvider({ children }) {
  const isTestnet = import.meta.env.VITE_APP_ENVIRONMENT === "dev";
  
  return (
    <SWRConfig
      value={{
        shouldRetryOnError: false,
        revalidateOnFocus: false,
      }}
    >
      <NextUIProvider>
        <QIEWalletProvider>
          <DynamicProvider>
            <Web3Provider>
              <AuthProvider>
                <UserProvider>
                  {children}
                </UserProvider>
              </AuthProvider>
            </Web3Provider>
          </DynamicProvider>
        </QIEWalletProvider>
      </NextUIProvider>
    </SWRConfig>
  );
}
