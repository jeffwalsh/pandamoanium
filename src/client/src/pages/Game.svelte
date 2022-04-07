<script lang="ts">
  import { onMount } from "svelte";
  import type { Message } from "../domain/message";
  import { currentAddress } from "../stores/currentAddress";
  import { currentGame } from "../stores/currentGame";
  import { socket } from "../stores/socket";
  import axios from "axios";
  import type { Player } from "../domain/game";
  import { currentPanda } from "../stores/currentPanda";
  import { push } from "svelte-spa-router";
  import Nav from "../components/Nav.svelte";
  import { randomLawyerCrow } from "../utils/randomLawyerCrow";
  import IconChat from "../components/IconChat.svelte";

  let messages: Message[] = [];
  let currentMessage: string = "";
  let activePlayer: Player;
  let choices: string[] = [];
  let active: boolean = false;
  let isHost: boolean = false;
  let timedOut: boolean = false;
  let timer: number = 69;
  let currentWord: string = "";
  let shouldShowWord: boolean = false;
  let lastPoint: { x: string | number; y: string | number };

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
      if ($currentGame.roomCode !== info.roomCode) return;
      messages.push(info.message);
      messages = messages;
      const c = document.getElementById("chat-box");
      if (!c) return;
      const shouldScroll = c.scrollTop + c.clientHeight === c.scrollHeight;
      if (!shouldScroll) {
        c.scrollTop = c.scrollHeight;
      }
    });

    $socket.on(
      "wordSelected",
      (info: { roomCode: string; currentWord: string }) => {
        if ($currentGame.roomCode !== info.roomCode) return;
        shouldShowWord = false;
        timer = 69;
        active = true;
        currentWord = info.currentWord;
      }
    );

    $socket.on("countdown", (info: { t: number; roomCode: string }) => {
      if ($currentGame.roomCode !== info.roomCode) return;
      timer = info.t;
    });

    $socket.on("timeout", (info: { roomCode: string }) => {
      if (info.roomCode !== $currentGame.roomCode) return;
      active = false;
      timedOut = true;
    });

    activePlayer = $currentGame.playerOrder[0] as Player;

    if (activePlayer.pandaName === $currentPanda.name) {
      await getChoices();
    }

    init();
  });

  $socket.on(
    "nextRound",
    async (info: { nextChooser: Player; roomCode: string }) => {
      if (info.roomCode !== $currentGame.roomCode) return;
      timedOut = false;
      activePlayer = info.nextChooser;
      if (info.nextChooser.pandaName !== "") {
        messages.push({
          player: { pandaName: "Lawyer Crow" } as any as Player,
          text: info.nextChooser.pandaName + " Is drawing this round!",
          isCorrect: false,
        });
        messages = messages;
      }

      if (activePlayer.pandaName === $currentPanda.name) {
        await getChoices();
      }
    }
  );

  $socket.on("gameOver", (info: { roomCode: string }) => {
    if (info.roomCode !== $currentGame.roomCode) return;
    const game = $currentGame;
    game.finished = true;
    active = false;
    messages.push({
      player: { pandaName: "Lawyer Crow" } as any as Player,
      text: randomLawyerCrow() as string,
      isCorrect: false,
    });
    messages = messages;
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
    async (info: { roomCode: string; playerOrder: Player[] }) => {
      if (info.roomCode !== $currentGame.roomCode) return;
      const game = $currentGame;
      game.playerOrder = info.playerOrder;
      game.finished = false;

      activePlayer = game.playerOrder[0] as Player;

      messages.push({
        player: { pandaName: "Lawyer Crow" } as any as Player,
        text: info.playerOrder[0]?.pandaName + " Is drawing this round!",
        isCorrect: false,
      });
      messages = messages;

      if (activePlayer.pandaName === $currentPanda.name) {
        await getChoices();
      }
      currentGame.set(game);
      timedOut = false;
      active = false;
      timer = 69;
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
    context.strokeStyle = "#fff";

    // Pencil tool instance.
    tool = new tool_pencil();

    // Get the position of a touch relative to the canvas
    function getTouchPos(canvasDom, touchEvent) {
      var rect = canvasDom.getBoundingClientRect();
      return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top,
      };
    }

    // Prevent scrolling when touching the canvas
    document.body.addEventListener(
      "touchstart",
      function (e) {
        if (e.target == canvas) {
          e.preventDefault();
        }
      },
      false
    );
    document.body.addEventListener(
      "touchend",
      function (e) {
        if (e.target == canvas) {
          e.preventDefault();
        }
      },
      false
    );
    document.body.addEventListener(
      "touchmove",
      function (e) {
        if (e.target == canvas) {
          e.preventDefault();
        }
      },
      false
    );

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener("mousedown", ev_canvas, false);
    canvas.addEventListener("mousemove", ev_canvas, false);
    canvas.addEventListener("mouseup", ev_canvas, false);
    canvas.addEventListener(
      "touchstart",
      function (e) {
        // const mousePos = getTouchPos(canvas, e);
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
          clientX: touch?.clientX,
          clientY: touch?.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
      },
      false
    );
    // canvas.addEventListener(
    //   "touchend",
    //   function (e) {
    //     var mouseEvent = new MouseEvent("mouseup", {});
    //     canvas.dispatchEvent(mouseEvent);
    //   },
    //   false
    // );
    canvas.addEventListener(
      "touchmove",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
      },
      false
    );
  }

  // This painting tool works like a drawing pencil which tracks the mouse
  // movements.
  function tool_pencil() {
    var tool = this;
    this.started = false;
    this.startX = null;
    this.startY = null;
    this.lines = [];

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (evt) {
      if (activePlayer.pandaName === $currentPanda.name && active) {
        context.beginPath();
        const pos = getMousePos(canvas, evt);
        tool.startX = pos.x;
        tool.startY = pos.y;
        context.moveTo(pos.x, pos.y);
        tool.started = true;
      }
    };

    // This function is called every time you move the mouse. Obviously, it only
    // draws if the tool.started state is set to true (when you are holding down
    // the mouse button).
    this.mousemove = function (evt) {
      if (
        tool.started &&
        activePlayer.pandaName === $currentPanda.name &&
        active
      ) {
        const pos = getMousePos(canvas, evt);
        context.lineTo(pos.x, pos.y);
        tool.lines.push({ x: pos.x, y: pos.y });
        context.stroke();
      }
    };

    function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top,
      };
    }

    // This is called when you release the mouse button.
    this.mouseup = function (evt) {
      if (
        tool.started &&
        activePlayer.pandaName === $currentPanda.name &&
        active
      ) {
        tool.mousemove(evt);
        tool.started = false;
        const pos = getMousePos(canvas, evt);
        $socket.emit("sendDraw", {
          startX: tool.startX,
          startY: tool.startY,
          lines: tool.lines,
          color: context.strokeStyle,
          roomCode: $currentGame.roomCode,
        });
        tool.lines = [];
      }
    };

    const t = this;
    $socket.on(
      "receiveDraw",
      (info: {
        startX: number | string;
        startY: number | string;
        lines: { x: number; y: number }[];
        color: string;
        roomCode: string;
      }) => {
        if (info.roomCode !== $currentGame.roomCode) return;
        if (activePlayer.pandaName === $currentPanda.name) return;
        // context.beginPath();
        // context.moveTo(info.x, info.y);
        // const ss = context.strokeStyle;
        // context.strokeStyle = info.color;

        // context.lineTo(info.x, info.y);
        // context.stroke();
        // context.strokeStyle = ss;
        // lastPoint = { x: info.x, y: info.y };
        // context.closePath();
        context.beginPath();
        console.log("recieve drew", info);
        context.strokeStyle = info.color;
        context.moveTo(info.startX, info.startY);
        info.lines.forEach((line) => {
          console.log("yo", line);
          context.lineTo(line.x, line.y);
        });
        context.stroke();
      }
    );

    $socket.on(
      "clearCanvas",
      (info: { roomCode: string; players: Player[] }) => {
        if (info.roomCode !== $currentGame.roomCode) return;
        shouldShowWord = true;
        context.clearRect(0, 0, canvas.width, canvas.height);
        active = false;
        timer = 0;
        const game = $currentGame;
        game.players = info.players;
        currentGame.set(game);
        lastPoint = null;
      }
    );
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

  function changeColor(color: string) {
    if (context) {
      context.strokeStyle = color;
    }
  }
</script>

<Nav />

<div class="container">
  <div class="flex flex-col game-lobby-head">
    <h2 class="grey6">Game In Progress</h2>
    <!-- <h3>
      Room Code: <span class="text-animation"> {$currentGame?.roomCode} </span>
    </h3> -->
    {#if currentWord}
      <h3 class="currentword">
        Current Word:
        {#if shouldShowWord}
          {currentWord}
        {:else}
          {#each currentWord as letter}
            {#if letter === " "}
              &nbsp;
            {:else}
              <span style="padding-left:3px;">_</span>
            {/if}
          {/each}
        {/if}
      </h3>
    {/if}
  </div>
</div>

<!-- Game Container STart -->

<div class="container game-container">
  <div class="grid grid-cols-3">
    <!-- Canvas Left Section -->
    <div class="game-canvas-left col-span-2">
      <!-- The button to open chat modal -->
      <label
        for="my-modal"
        class="btn modal-button chat-button"
        on:click={() =>
          document.getElementById("my-modal")?.classList.add("modal-open")}
      >
        <span> <IconChat /> </span> Chat</label
      >

      <div class="choices">
        {#if active}
          Timer: {timer}
        {/if}
        {#if activePlayer && activePlayer.pandaName === $currentPanda.name && choices && choices.length && !active}
          <h2>Choices</h2>
          <p class="marb-10 ">
            Choose an option that you want to draw. Others will try to guess it.
          </p>
          {#each choices as choice}
            <p
              class="cursor-pointer choice"
              on:click={async () => await selectChoice(choice)}
            >
              {choice}
            </p>
          {/each}
        {/if}
      </div>

      {#if $currentGame.finished}
        <div class="game-finished">
          <h2>Game is finished!</h2>
          {#if isHost}
            <button class="btn btn-primary" on:click={restartGame}
              >Play Again?</button
            >
          {/if}
        </div>
      {/if}

      <div class="game-finished">
        {#if timedOut}
          <p class="timed-out">Timed out!</p>
        {/if}
      </div>

      <canvas
        style="background:#333333;touch-action:none;"
        id="imageView"
        width="600"
        height="400"
      />

      {#if activePlayer && activePlayer.pandaName === $currentPanda.name}
        <div
          class="colors grid grid-cols-6 auto-rows-max gap-x-5 gap-y-5 w-auto"
        >
          <div class="cwhite color" on:click={() => changeColor("#fff")} />
          <div class="cred color" on:click={() => changeColor("#ff0000")} />
          <div class="cyellow color" on:click={() => changeColor("#f8f83b")} />
          <div class="cteal color" on:click={() => changeColor(" #00ffff")} />
        </div>
      {/if}
    </div>

    <!-- chat box RIght Setion -->

    <div class="chat-right-section desktop-chat">
      <div id="chat-box">
        {#if messages}
          {#each messages as message}
            <p
              class={message.isCorrect
                ? "green"
                : message.player.pandaName === "Lawyer Crow"
                ? "red"
                : ""}
            >
              {#if message.isCorrect}
                {message.player.pandaName} got the answer!
              {:else}
                {message.player.pandaName}: {message.text}
              {/if}
            </p>
          {/each}
        {/if}
      </div>

      <input
        placeholder="Type Here Noob"
        class="chat-input"
        type="text"
        disabled={(activePlayer &&
          activePlayer.pandaName === $currentPanda.name) ||
          !active}
        bind:value={currentMessage}
        on:keyup|preventDefault={handleKeyup}
      />
    </div>
  </div>
</div>

<!-- Game Container End -->

<div class="container">
  <div
    class="grid grid-cols-6 auto-rows-max gap-x-5 gap-y-5 w-auto panda-container"
  >
    {#if $currentGame.players}
      {#each $currentGame.players as player}
        <div class="panda-pp rounded-md">
          <img src={player.thumbnail} class="panda" />
          <p class="grey5 panda-title">{player.pandaName}</p>
          <p class="score">Score:<span>{player.score}</span></p>
          {#if $currentGame.correctPlayersThisRound.find((p) => p.pandaName === player.pandaName)}
            <p>Correct!</p>{/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<!-- Mobile Chat Content -->
<div class="container">
  <div id="my-modal" class="modal">
    <div class="modal-box">
      <div class="modal-action">
        <label
          for="my-modal"
          class="btn"
          on:click={() =>
            document.getElementById("my-modal")?.classList.remove("modal-open")}
          >Close</label
        >
      </div>

      <div id="chat-box">
        {#if messages}
          {#each messages as message}
            <p
              class={message.isCorrect
                ? "green"
                : message.player.pandaName === "Lawyer Crow"
                ? "red"
                : ""}
            >
              {#if message.isCorrect}
                {message.player.pandaName} got the answer!
              {:else}
                {message.player.pandaName}: {message.text}
              {/if}
            </p>
          {/each}
        {/if}
      </div>

      <input
        placeholder="Type Here Noob"
        class="chat-input"
        type="text"
        disabled={(activePlayer &&
          activePlayer.pandaName === $currentPanda.name) ||
          !active}
        bind:value={currentMessage}
        on:keyup|preventDefault={handleKeyup}
      />
    </div>
  </div>
</div>

<style>
  .green {
    color: green;
  }

  .red {
    color: red;
  }

  .container.game-container {
    padding: 0;
    background: #333;
    box-sizing: border-box;
    backdrop-filter: blur(15px);
    min-height: 480px;
    border-radius: 5px;
    margin-bottom: 10px;
  }

  .game-canvas-left {
    padding: 10px 19px;
    position: relative;
  }

  .choices {
    position: absolute;
    padding: 0px 14px;
  }

  .choices h2 {
    margin: 6px 0px 0px 0px;
  }

  p.marb-10 {
    margin-bottom: 11px;
  }

  p.cursor-pointer.choice {
    font-size: 1.2rem;
    font-weight: 600;
    color: #f8f83b;
    margin: 0px 0px 4px 0px;
  }

  .chat-right-section {
    background: #000;
    padding: 10px 19px;
  }

  #chat-box {
    background: black;
    color: white;
    border-radius: 7px;
    padding: 20px;
    position: relative;
    max-height: 400px;
    overflow-y: scroll;
    height: 400px;
  }

  .chat-input {
    padding: 12px 22px;
    border-radius: 0.5rem;
    background: #211e1ebf;
    width: 100%;
    margin: 29px 0px 0px 0px;
  }

  h3 {
    color: #9da2ad;
    margin: -28px 0px 8px 0px;
  }

  .grid.grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .grid.grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .col-span-2 {
    grid-column: span 2 / span 2;
  }

  .colors {
    max-width: 255px;
  }

  .color {
    width: 30px;
    height: 30px;
    border-radius: 5px;
  }

  .cwhite {
    background-color: #fff;
  }

  .cred {
    background-color: #ff0000;
  }

  .cyellow {
    background-color: #f8f83b;
  }

  .cteal {
    background-color: #00ffff;
  }

  .color.active {
    border: 4px solid #000;
  }

  .game-finished {
    -webkit-box-ordinal-group: 99999;
    -webkit-box-ordinal-group: 99999;
    text-align: center;
    position: absolute;
    top: 20px;
    margin: 0 auto;
    width: 90%;
    background: #333;
  }

  .game-finished h2 {
    margin: 31px 0px 10px 0px;
  }

  .game-container h2 {
    font-size: 1.5rem;
  }

  p.score {
    font-size: 1rem;
    font-weight: 600;
    line-height: 20px;
  }

  p.panda-title {
    font-size: 0.83rem;
    font-weight: 500;
    margin: 8px 0px 0px 0px;
  }

  .modal-box {
    background: #000;
  }

  .modal-box input {
    border: 1px solid #343434;
  }

  .modal-action {
    position: absolute;
    right: 24px;
    top: 0px;
    z-index: 9999;
    /* background: #000; */
  }

  label.btn {
    background: #211e1ebf;
  }

  label.btn.modal-button span {
    max-width: 20px;
    margin: 0px 6px 0px 0px;
  }

  .chat-button {
    position: absolute;
    top: 10px;
    right: 20px;
    visibility: hidden;
  }

  @media (max-width: 800px) {
    .grid.grid-cols-6 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 600px) {
    h3 {
      color: #9da2ad;
      margin: 0px;
    }

    .grid.grid-cols-3 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .desktop-chat {
      display: none;
    }

    .col-span-2 {
      grid-column: span 1 / span 1;
    }

    .container .modal-box {
      text-align: left;
    }
    .game-canvas-left {
      padding: 10px 19px;
      position: relative;
      overflow-x: scroll;
    }

    .chat-button {
      visibility: visible;
      z-index: 99999999;
    }
  }
</style>
