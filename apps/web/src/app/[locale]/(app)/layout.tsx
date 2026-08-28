import type { ReactNode } from "react";
import { AppChrome } from "../../../components/app-chrome.tsx";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppChrome>{children}</AppChrome>;
}
