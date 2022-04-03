import { writable } from "svelte/store";
import type { Game } from "../domain/game";

const currentGame = writable<Game | undefined>(undefined);

export { currentGame };
