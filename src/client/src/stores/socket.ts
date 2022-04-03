import { writable } from "svelte/store";
import type { Game } from "../domain/game";
import { io, Socket } from "socket.io-client";

const socket = writable<Socket>(io(process.env.SERVER_URL as string));

export { socket };
