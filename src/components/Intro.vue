<template>
  <div class="intro">
    <div
      v-if="grimoire.showCenterMark"
      class="center-mark"
      :style="{ backgroundImage: `url(${demonHead})` }"
      aria-hidden="true"
    ></div>
    <div class="intro-body">
      {{ $t("intro.welcome") }}
      <br />
      {{ $t("intro.addPlayers") }}
      <span class="button" @click="toggleMenu">
        <font-awesome-icon icon="cog" /> 選單
      </span>
      <div class="disclaimer">{{ $t("menu.disclaimer") }}</div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import demonHead from "../assets/demon-head.png";

export default {
  data() {
    return { demonHead };
  },
  computed: mapState(["grimoire"]),
  methods: mapMutations(["toggleMenu"])
};
</script>

<style scoped lang="scss">
.intro {
  text-align: center;
  width: min(50%, 420px);
  max-width: calc(100vw - 32px);
  font-size: clamp(0.85rem, 3.2vw, 1.2rem);
  position: absolute;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid black;
  border-radius: 10px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .intro-body {
    width: 100%;
  }

  .center-mark {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: clamp(72px, 22vmin, 200px);
    height: clamp(72px, 22vmin, 200px);
    margin-bottom: clamp(8px, 2vh, 16px);
    background-position: center center;
    background-repeat: no-repeat;
    background-size: contain;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.75));
    pointer-events: none;
  }

  .disclaimer {
    font-size: clamp(0.58rem, 2vw, 0.72rem);
    line-height: 1.35;
    opacity: 0.88;
    margin-top: 1em;
    text-align: center;
    white-space: normal;
  }
}

@media screen and (max-width: 767.98px) {
  .intro {
    width: min(92vw, 360px);
    font-size: clamp(0.8rem, 3.6vw, 1rem);
    padding: 8px 10px;
  }

  .intro .center-mark {
    width: clamp(64px, 26vw, 160px);
    height: clamp(64px, 26vw, 160px);
  }

  .intro .disclaimer {
    font-size: clamp(0.52rem, 2.4vw, 0.65rem);
  }
}

@media screen and (max-height: 600px) {
  .intro .center-mark {
    width: clamp(48px, 16vmin, 120px);
    height: clamp(48px, 16vmin, 120px);
    margin-bottom: 6px;
  }
}
</style>
