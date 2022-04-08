<script lang="ts">
  import Router from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import Connect from "./pages/Connect.svelte";
  import Game from "./pages/Game.svelte";
  import GameMenu from "./pages/GameMenu.svelte";
  import Leaderboard from "./pages/Leaderboard.svelte";
  import Lobby from "./pages/Lobby.svelte";
  import SelectPanda from "./pages/SelectPanda.svelte";

  const routes = {
    "/": wrap({
      component: Connect,
    }),
    "/selectPanda": wrap({
      component: SelectPanda,
    }),
    "/gameMenu": wrap({
      component: GameMenu,
    }),
    "/lobby": wrap({
      component: Lobby,
    }),
    "/game": wrap({
      component: Game,
    }),
    "/leaderboard": wrap({
      component: Leaderboard,
    }),
  };
</script>

<div class="center-screen">
  <Router {routes} />
</div>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  /* purgecss end ignore */
  @tailwind utilities;

  /* General page styles */
  html,
  body {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0px;
    padding: 0px;
    background-color: #000;
    color: #e0e0e0;
  }

  img.panda {
    max-width: 90%;
    border-radius: 0.25rem;
  }

  .panda-pp p {
    text-align: left;
    font-size: 1rem;
  }

  h2 {
    font-size: 2rem;
    margin: 35px 0px;
  }

  .gap-y-5 {
    row-gap: 1.25rem;
  }
  .gap-x-5 {
    -moz-column-gap: 1.25rem;
    column-gap: 1.25rem;
  }
  .grid-cols-4.panda-container {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0 auto;
  }

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 10px 10px;
  }

  .center-content {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
    padding: 0px 20px;
  }

  .flex-col {
    flex-direction: column;
  }

  body {
    background-color: rgba(0, 0, 0, 0.534);
    background-image: url("images/doingeverything.jpg");
    background-repeat: repeat-y;
    background-size: cover;
    font-family: Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    width: 100%;
    min-height: 100vh;
    height: auto;
  }

  /* Colors */

  .mblack {
    color: #000000;
  }

  .lblack {
    color: #211e1e;
  }

  .grey1 {
    color: #333333;
  }

  .grey2 {
    color: #4f4f4f;
  }

  .grey3 {
    color: #828282;
  }

  .grey4 {
    color: #bdbdbd;
  }

  .grey5 {
    color: #e0e0e0;
  }

  .grey6 {
    color: #f2f2f2;
  }

  /* Fonts */
  @font-face {
    font-family: "Rubik";
    src: url("/fonts/Rubik-Regular.ttf");
    font-weight: 500;
  }

  @font-face {
    font-family: "Rubik";
    src: url("/fonts/Rubik-Medium.ttf");
    font-weight: 600;
  }

  @font-face {
    font-family: "Rubik";
    src: url("/fonts/Rubik-SemiBold.ttf");
    font-weight: 700;
  }

  @font-face {
    font-family: "Rubik";
    src: url("/fonts/Rubik-Bold.ttf");
    font-weight: 800;
  }

  @font-face {
    font-family: "Rubik";
    src: url("/fonts/Rubik-Black.ttf");
    font-weight: 900;
  }

  h2 {
    font-size: 2rem;
    font-weight: 800;
    margin: 35px 0px 20px 0px;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: E5E6EA;
  }

  .text-animation {
    background: linear-gradient(
      to right,
      #fff 20%,
      #ff0 40%,
      #ff0 60%,
      #fff 80%
    );
    background-size: 200% auto;
    color: #000;
    background-clip: text;
    text-fill-color: transparent;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 1s linear infinite;
  }
  @keyframes shine {
    to {
      background-position: 200% center;
    }
  }

  /* Buttons */
  .btn-primary {
    background-color: #f2f2f2;
    color: #211e1e;
    padding: 10px;
    padding: 1rem 4rem;
  }

  .btn-primary:hover {
    background-color: #f2f2f2;
    color: #211e1e;
    border: none;
    animation: rotate 0.7s ease-in-out both;
  }
  button:hover span {
    animation: storm 0.7s ease-in-out both;
    animation-delay: 0.06s;
  }

  @keyframes rotate {
    0% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }
    25% {
      transform: rotate(3deg) translate3d(0, 0, 0);
    }
    50% {
      transform: rotate(-3deg) translate3d(0, 0, 0);
    }
    75% {
      transform: rotate(1deg) translate3d(0, 0, 0);
    }
    100% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }
  }

  @keyframes storm {
    0% {
      transform: translate3d(0, 0, 0) translateZ(0);
    }
    25% {
      transform: translate3d(4px, 0, 0) translateZ(0);
    }
    50% {
      transform: translate3d(-3px, 0, 0) translateZ(0);
    }
    75% {
      transform: translate3d(2px, 0, 0) translateZ(0);
    }
    100% {
      transform: translate3d(0, 0, 0) translateZ(0);
    }
  }

  .justify-between {
    justify-content: space-between;
  }
  .content-center {
    align-content: center;
  }

  .nav {
    font-size: 1rem;
    font-weight: 700;
    padding: 10px 0px;
  }

  .nav svg {
    max-width: 170px;
  }

  @media (max-width: 600px) {
    .grid-cols-4.panda-container {
      grid-template-columns: repeat(1, minmax(0, 1fr));
      margin: 0 auto;
      padding: 20px;
    }

    .leaderboard.cursor-pointer {
      padding-top: 7px;
    }

    .nav {
      padding: 10px 20px;
    }

    .container {
      text-align: center;
    }

    .container h2 {
      width: 100%;
      margin-bottom: 4px;
      line-height: 2.3rem;
    }

    .panda-pp {
      max-width: 300px;
      margin: 0 auto;
    }

    .panda-pp img.panda {
      max-width: 100%;
    }
  }
</style>
