import { writable } from "svelte/store";
import type { Panda } from "../utils/getPandasForAddress";

const currentAddress = writable<Panda>({} as any as Panda);

export { currentAddress };
