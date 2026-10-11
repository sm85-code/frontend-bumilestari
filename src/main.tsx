import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource-variable/plus-jakarta-sans";
import { ConfigProvider, App as AntApp } from "antd";
import idID from "antd/locale/id_ID";
import { tema } from "./theme";
import MultilineText from "./components/MultilineText";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppBaru from "./baru/AppBaru";
import "./index.css";

dayjs.locale("id");

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true, staleTime: 15_000 } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={tema} locale={idID}><AntApp><BrowserRouter>
            <AuthProvider>
              <AppBaru />
              <MultilineText />
            </AuthProvider>
      </BrowserRouter></AntApp></ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);
