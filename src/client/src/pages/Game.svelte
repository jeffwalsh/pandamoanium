<script lang="ts">
  import { onMount } from "svelte";
  import type { Message } from "../domain/message";
  import { currentAddress } from "../stores/currentAddress";
  import { currentGame } from "../stores/currentGame";
  import { socket } from "../stores/socket";
  import axios from "axios";
  import type { Player } from "../domain/game";
  import { currentPanda } from "../stores/currentPanda";
  import { xlink_attr } from "svelte/internal";
  import { stringify } from "querystring";
  import App from "../App.svelte";
  import { push } from "svelte-spa-router";

  let messages: Message[] = [];
  let currentMessage: string = "";
  let activePlayer: Player;
  let choices: string[] = [];
  let active: boolean = false;
  let isHost: boolean = false;

  onMount(async () => {
    if (!$currentPanda || !$currentPanda.name) {
      await push("/");
      return;
    }
    if (
      $currentGame.players.find(
        (p) => p.pandaName === $currentPanda.name && p.isHost
      )
    ) {
      isHost = true;
    }

    $socket.on("message", (info: { roomCode: string; message: Message }) => {
      console.log("got message", info);
      if ($currentGame.roomCode !== info.roomCode) return;
      console.log("client received message", info.message);
      messages.push(info.message);
      messages = messages;
    });

    $socket.on("wordSelected", () => {
      active = true;
    });

    activePlayer = $currentGame.players[0] as Player;

    if (activePlayer.pandaName === $currentPanda.name) {
      await getChoices();
    }

    init();
  });

  $socket.on(
    "nextRound",
    async (info: { nextChooser: Player; roomCode: string }) => {
      if (info.roomCode !== $currentGame.roomCode) return;

      activePlayer = info.nextChooser;

      if (activePlayer.pandaName === $currentPanda.name) {
        await getChoices();
      }
    }
  );

  $socket.on("gameOver", (info: { roomCode: string }) => {
    if (info.roomCode !== $currentGame.roomCode) return;
    const game = $currentGame;
    game.finished = true;
    currentGame.set(game);
  });

  const getChoices = async () => {
    const resp = await axios.get<{ choices: string[] }>(
      `${process.env.SERVER_URL}/choices`
    );
    choices = resp.data.choices;
  };

  const handleKeyup = (event: any) => {
    if (!activePlayer || activePlayer.pandaName === $currentPanda.name) {
      event.preventDefault();
      return;
    }
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

  $socket.on(
    "restartedGame",
    (info: { roomCode: string; playerOrder: Player[] }) => {
      if (info.roomCode !== $currentGame.roomCode) return;
      const game = $currentGame;
      game.playerOrder = info.playerOrder;
      currentGame.set(game);
    }
  );

  function restartGame() {
    $socket.emit("restartGame", $currentGame.roomCode);
  }

  const selectChoice = async (choice: string) => {
    await axios.get(
      `${process.env.SERVER_URL}/selectWord?word=${choice}&roomCode=${$currentGame.roomCode}`
    );
    choices = [];
  };

  var canvas, context, tool;

  function init() {
    // Find the canvas element.
    canvas = document.getElementById("imageView");
    if (!canvas) {
      alert("Error: I cannot find the canvas element!");
      return;
    }

    // Get the 2D canvas context.
    context = canvas.getContext("2d");

    // Pencil tool instance.
    tool = new tool_pencil();

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener("mousedown", ev_canvas, false);
    canvas.addEventListener("mousemove", ev_canvas, false);
    canvas.addEventListener("mouseup", ev_canvas, false);
  }

  // This painting tool works like a drawing pencil which tracks the mouse
  // movements.
  function tool_pencil() {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (ev) {
      context.beginPath();
      context.moveTo(ev._x, ev._y);
      tool.started = true;
    };

    // This function is called every time you move the mouse. Obviously, it only
    // draws if the tool.started state is set to true (when you are holding down
    // the mouse button).
    this.mousemove = function (ev) {
      if (
        tool.started &&
        activePlayer.pandaName === $currentPanda.name &&
        active
      ) {
        context.lineTo(ev._x, ev._y);
        context.stroke();
        console.log("emitting sendDraw");
        $socket.emit("sendDraw", {
          x: ev._x,
          y: ev._y,
          roomCode: $currentGame.roomCode,
        });
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function (ev) {
      if (tool.started && activePlayer.pandaName === $currentPanda.name) {
        tool.mousemove(ev);
        tool.started = false;
      }
    };

    const t = this;
    $socket.on(
      "receiveDraw",
      (info: { x: number | string; y: number | string; roomCode: string }) => {
        console.log("receiveDraw", info);
        if (info.roomCode !== $currentGame.roomCode) return;
        if (activePlayer.pandaName === $currentPanda.name) return;
        context.lineTo(info.x, info.y);
        context.stroke();
      }
    );

    $socket.on("clearCanvas", (info: { roomCode: string }) => {
      if (info.roomCode !== $currentGame.roomCode) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      active = false;
    });
  }

  // The general-purpose event handler. This function just determines the mouse
  // position relative to the canvas element.
  function ev_canvas(ev) {
    if (ev.layerX || ev.layerX == 0) {
      // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) {
      // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }
</script>

{#if activePlayer && activePlayer.pandaName === $currentPanda.name && choices && !active}
  <h2>Choices</h2>
  {#each choices as choice}
    <p class="cursor-pointer" on:click={async () => await selectChoice(choice)}>
      {choice}
    </p>
  {/each}
{/if}

<canvas style="background:white;" id="imageView" width="400" height="300" />

<!-- chat box -->
<div id="chat-box">
  {#each messages as message}
    <p class={message.isCorrect ? "green" : ""}>
      {#if message.isCorrect}
        {message.player.pandaName} got the answer!
      {:else}
        {message.player.pandaName}: {message.text}
      {/if}
    </p>
  {/each}
</div>

<input
  type="text"
  disabled={(activePlayer && activePlayer.pandaName === $currentPanda.name) ||
    !active}
  bind:value={currentMessage}
  on:keyup|preventDefault={handleKeyup}
/>

{#if $currentGame.finished}
  Game is finished!
  {#if isHost}
    <button class="btn btn-primary" on:click={restartGame}>Play Again?</button>
  {/if}
{/if}

<style>
  .green {
    color: green;
  }
  #chat-box {
    background: white;
    color: black;
  }
</style>
