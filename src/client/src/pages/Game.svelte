<script lang="ts">
  import { onMount } from "svelte";
  import type { Message } from "../domain/message";
  import { currentAddress } from "../stores/currentAddress";
  import { currentGame } from "../stores/currentGame";
  import { socket } from "../stores/socket";
  import axios from "axios";
  import type { Player } from "../domain/game";
  import { currentPanda } from "../stores/currentPanda";

  let messages: Message[] = [];
  let currentMessage: string = "";
  let activePlayer: Player;
  let choices: string[] = [];

  onMount(async () => {
    $socket.on("message", (info: { roomCode: string; message: Message }) => {
      console.log("got message", info);
      if ($currentGame.roomCode !== info.roomCode) return;
      console.log("client received message", info.message);
      messages.push(info.message);
      messages = messages;
    });

    activePlayer = $currentGame.players[0] as Player;

    if (activePlayer.pandaName === $currentPanda.name) {
      await getChoices();
    }
  });

  const getChoices = async () => {
    const resp = await axios.get<{ choices: string[] }>(
      `${process.env.SERVER_URL}/choices`
    );
    choices = resp.data.choices;
  };

  const handleKeyup = (event: any) => {
    if (event.code == "Enter") {
      event.preventDefault();
      $socket.emit("chatMessage", {
        address: $currentAddress?.toString(),
        text: currentMessage,
        roomCode: $currentGame.roomCode,
      });
      currentMessage = "";
    }
  };
</script>

{#if choices}
  <h2>Choices</h2>
  {#each choices as choice}
    <p>{choice}</p>
  {/each}
{/if}
<!-- chat box -->
{#each messages as message}
  <p>{message.player.pandaName}: {message.text}</p>
{/each}

<input
  type="text"
  bind:value={currentMessage}
  on:keyup|preventDefault={handleKeyup}
/>
