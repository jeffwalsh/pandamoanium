import { writable } from "svelte/store";
import type { Game } from "../domain/game";

const currentGame = writable<Game>({} as any as Game);

export { currentGame };
