<script lang="ts">
  import { onMount } from "svelte";
  import type { Message } from "../domain/message";
  import { currentAddress } from "../stores/currentAddress";
  import { currentGame } from "../stores/currentGame";
  import { socket } from "../stores/socket";

  let messages: Message[] = [];
  onMount(() => {
    $socket.on("message", (info: { roomCode: string; message: Message }) => {
      if ($currentGame.roomCode !== info.roomCode) return;
      console.log("client received message", info.message);
      messages.push(info.message);
    });
  });
</script>

<!-- chat box -->
{#each messages as message}
  <p>{message.player.pandaName}: {message.text}</p>
{/each}
