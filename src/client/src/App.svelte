<script lang="ts">
  import Router from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import Connect from "./pages/Connect.svelte";
  import Game from "./pages/Game.svelte";
  import GameMenu from "./pages/GameMenu.svelte";
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
    color: #E0E0E0;
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
  color:#000000 ;
}

.lblack {
color: #211E1E;
}

.grey1 {
color: #333333;
}

.grey2 {
color: #4F4F4F;
}

.grey3 {
color: #828282;
}

.grey4 {
color: #BDBDBD;
}

.grey5 {
color: #E0E0E0;
}

.grey6 {
color: #F2F2F2;
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
      font-size: 4rem;
      font-weight: 800;
    }

/* Buttons */
.btn-primary {
  background-color: #F2F2F2;
  color: #211E1E;
  padding: 10px;
  padding: 1rem 4rem;
}


.btn-primary:hover {
  background-color: #F2F2F2;
  color: #211E1E;
  border: none;
    animation: rotate 0.7s ease-in-out both; }
    button:hover span {
      animation: storm 0.7s ease-in-out both;
      animation-delay: 0.06s; }

@keyframes rotate {
  0% {
    transform: rotate(0deg) translate3d(0, 0, 0); }
  25% {
    transform: rotate(3deg) translate3d(0, 0, 0); }
  50% {
    transform: rotate(-3deg) translate3d(0, 0, 0); }
  75% {
    transform: rotate(1deg) translate3d(0, 0, 0); }
  100% {
    transform: rotate(0deg) translate3d(0, 0, 0); } }

@keyframes storm {
  0% {
    transform: translate3d(0, 0, 0) translateZ(0); }
  25% {
    transform: translate3d(4px, 0, 0) translateZ(0); }
  50% {
    transform: translate3d(-3px, 0, 0) translateZ(0); }
  75% {
    transform: translate3d(2px, 0, 0) translateZ(0); }
  100% {
    transform: translate3d(0, 0, 0) translateZ(0); } }


</style>
