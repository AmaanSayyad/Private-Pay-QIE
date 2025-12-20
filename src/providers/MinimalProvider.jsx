import { NextUIProvider } from "@nextui-org/react";
import { SWRConfig } from "swr";
import { Toaster } from "react-hot-toast";
import { RootLayout } from "../layouts/RootLayout.jsx";

/**
 * Minimal provider for QIE pages
 * No Dynamic, Web3, Auth, or User providers needed
 */
export default function MinimalProvider({ children }) {
  return (
    <SWRConfig
      value={{
        shouldRetryOnError: false,
        revalidateOnFocus: false,
      }}
    >
      <NextUIProvider>
        <RootLayout>
          <Toaster />
          {children}
        </RootLayout>
      </NextUIProvider>
    </SWRConfig>
  );
}

