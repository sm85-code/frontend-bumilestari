import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StyleProvider } from "@ant-design/cssinjs";
import { App as AntApp, ConfigProvider } from "antd";
import idID from "antd/locale/id_ID";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import App from "./App";
import { tema } from "./theme";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true, staleTime: 15_000 } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* layer: gaya antd masuk @layer antd (di bawah utilitas Tailwind) agar class seperti space-y-4 / mb-3 tetap berlaku. */}
        <StyleProvider layer>
          <ConfigProvider theme={tema} locale={idID}>
            <AntApp>
              <AuthProvider>
                <App />
              </AuthProvider>
            </AntApp>
          </ConfigProvider>
        </StyleProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
