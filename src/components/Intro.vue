<template>
  <div class="intro">
    <img src="static/apple-icon.png" alt="" class="logo" />
    <div>
      {{ $t("intro.welcome") }}
      <br />
      {{ $t("intro.addPlayers") }}
      <span class="button" @click="toggleMenu">
        <font-awesome-icon icon="cog" /> 選單
      </span>
      <br />
      <div class="footer">
        {{ $t("intro.footer") }}
        <a href="https://github.com/bra1n/townsquare" target="_blank">GitHub</a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";

export default {
  methods: mapMutations(["toggleMenu"])
};
</script>

<style scoped lang="scss">
// Intro
.intro {
  text-align: center;
  width: 50%;
  font-size: 120%;
  position: absolute;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid black;
  border-radius: 10px;
  z-index: 3;
  display: flex;
  justify-content: center;
  a {
    color: white;
  }

  img.logo {
    position: absolute;
    bottom: 100%;
    width: 25vh;
    margin-bottom: 2vh;
    max-width: 192px;
    border-radius: 50%;
    box-shadow: 0 0 10px black;
    border: 3px solid black;
  }
  .footer {
    font-size: 60%;
    opacity: 0.75;
    margin-top: 1em;
  }
}
</style>
