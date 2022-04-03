import { writable } from "svelte/store";
import type { Panda } from "../utils/getPandasForAddress";

const currentPanda = writable<Panda>({} as any as Panda);

export { currentPanda };
