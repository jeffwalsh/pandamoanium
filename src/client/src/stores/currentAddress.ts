import type { PublicKey } from "@solana/web3.js";
import { writable } from "svelte/store";

const currentAddress = writable<PublicKey | undefined>(undefined);

export { currentAddress };
