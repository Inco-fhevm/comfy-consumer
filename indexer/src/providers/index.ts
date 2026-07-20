import { cfg, type ProviderName } from "../config.js";
import { alchemy } from "./alchemy.js";
import { quicknode } from "./quicknode.js";
import type { Provider } from "./types.js";

const ALL: Record<ProviderName, Provider> = { quicknode, alchemy };

// Enabled providers; first is active.
export const PROVIDERS: Provider[] = cfg.enabledProviders.map((n) => ALL[n]);
export const activeProvider = cfg.activeProvider ? ALL[cfg.activeProvider] : undefined;
export type { Provider };
