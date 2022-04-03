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
  let active: boolean = false;

  onMount(async () => {
    $socket.on("message", (info: { roomCode: string; message: Message }) => {
      console.log("got message", info);
      if ($currentGame.roomCode !== info.roomCode) return;
      console.log("client received message", info.message);
      messages.push(info.message);
      messages = messages;

      if (info.message.isCorrect) {
        active = false;
      }
    });

    $socket.on("wordSelected", () => {
      active = true;
    });

    activePlayer = $currentGame.players[0] as Player;

    if (activePlayer.pandaName === $currentPanda.name) {
      await getChoices();
    }
  });

  $socket.on("nextRound", async (info: { nextChooser: Player }) => {
    activePlayer = info.nextChooser;

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

  const selectChoice = async (choice: string) => {
    await axios.get(
      `${process.env.SERVER_URL}/selectWord?word=${choice}&roomCode=${$currentGame.roomCode}`
    );
    choices = [];
  };
</script>

{#if choices && !active}
  <h2>Choices</h2>
  {#each choices as choice}
    <p class="cursor-pointer" on:click={async () => await selectChoice(choice)}>
      {choice}
    </p>
  {/each}
{/if}
<!-- chat box -->
{#each messages as message}
  <p class={message.isCorrect ? "green" : ""}>
    {message.player.pandaName}: {message.text}
  </p>
{/each}

<input
  type="text"
  bind:value={currentMessage}
  on:keyup|preventDefault={handleKeyup}
/>

<style>
  .green {
    color: green;
  }
</style>
