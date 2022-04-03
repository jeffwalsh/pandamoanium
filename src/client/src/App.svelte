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

  html,
  body {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0px;
    padding: 0px;
    background-color: #000;
  }

  .center-screen {
    min-height: 100vh;
    max-width: 1000px;
    margin: 0 auto;
  }

  .center-content {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
  }

  body {
    background-color: rgba(0, 0, 0, 0.534);
    background-image: url("images/doingeverything.jpg");
    background-repeat: no-repeat;
    background-size: cover;
    font-family: Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      width: 100%;
      height: 100%;

  }

  /* .wrapper-blur {
    min-height: 100vh;
    margin: 0 auto;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(15px);
} */

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


</style>
