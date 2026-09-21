/// <reference types="vite/client" />

import type { SasApi } from "./shared/types";

declare global {
  interface Window {
    sas?: SasApi;
  }
}

export {};
