<template>
  <div
    class="token"
    @click="setRole"
    :class="[role.id, { compact: isCompact }]"
  >
    <span
      class="icon"
      v-if="role.id"
      :style="{
        backgroundImage: `url(${iconUrl})`
      }"
    ></span>
    <span
      class="leaf-left"
      v-if="role.firstNight || role.firstNightReminder"
    ></span>
    <span
      class="leaf-right"
      v-if="role.otherNight || role.otherNightReminder"
    ></span>
    <span v-if="reminderLeaves" :class="['leaf-top' + reminderLeaves]"></span>
    <span class="leaf-orange" v-if="role.setup"></span>
    <span
      v-if="isCompact && shortName"
      class="short-name"
      :class="role.team"
    >{{ shortName }}</span>
    <svg v-else-if="!isCompact" viewBox="0 0 150 150" class="name">
      <path
        d="M 13 75 C 13 160, 138 160, 138 75"
        id="curve"
        fill="transparent"
      />
      <text
        width="150"
        x="66.6%"
        text-anchor="middle"
        class="label mozilla"
        :font-size="role.name | nameToFontSize"
      >
        <textPath xlink:href="#curve">
          {{ role.name }}
        </textPath>
      </text>
    </svg>
    <div class="edition" :class="[`edition-${role.edition}`, role.team]"></div>
    <div class="ability" v-if="role.ability">
      {{ role.ability }}
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Token",
  props: {
    role: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    reminderLeaves: function() {
      return (
        (this.role.reminders || []).length +
        (this.role.remindersGlobal || []).length
      );
    },
    isCompact() {
      return !!(this.grimoire && this.grimoire.isCompactToken);
    },
    shortName() {
      const name = (this.role && this.role.name) || "";
      return name.slice(0, 2);
    },
    iconUrl() {
      if (this.role.image && this.grimoire.isImageOptIn) {
        return this.role.image;
      }
      const teamFallback = {
        townsfolk: "good",
        outsider: "outsider",
        minion: "minion",
        demon: "evil",
        traveler: "traveler",
        fabled: "fabled",
        loric: "loric"
      };
      const candidates = [
        this.role.imageAlt,
        this.role.id,
        teamFallback[this.role.team],
        "custom"
      ].filter(Boolean);
      const icons = require.context("../assets/icons", false, /\.png$/);
      for (const id of candidates) {
        const key = `./${id}.png`;
        if (icons.keys().includes(key)) {
          return icons(key);
        }
      }
      return icons("./custom.png");
    },
    ...mapState(["grimoire"])
  },
  data() {
    return {};
  },
  filters: {
    // CJK role names need a bit more size than Latin to stay crisp on the arc.
    nameToFontSize: name => {
      if (!name) return "130%";
      const len = name.length;
      if (len > 8) return "108%";
      if (len > 5) return "120%";
      return "132%";
    }
  },
  methods: {
    setRole() {
      this.$emit("set-role");
    }
  }
};
</script>

<style scoped lang="scss">
@import "../vars.scss";
@import "../gstone-assets.scss";

.token {
  border-radius: 50%;
  width: 100%;
  background: url($gstone-token) center center;
  background-size: 113%;
  text-align: center;
  @include gstone-token-shadow;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 250ms;

  // Classic tokens get height from the curved-name SVG.
  // Compact mode removes that SVG, so keep a square disc explicitly.
  &.compact {
    aspect-ratio: 1 / 1;
  }

  &:hover .name .label {
    stroke: black;
    fill: white;
    @-moz-document url-prefix() {
      &.mozilla {
        stroke: none;
        filter: drop-shadow(0 1.5px 0 black) drop-shadow(0 -1.5px 0 black)
          drop-shadow(1.5px 0 0 black) drop-shadow(-1.5px 0 0 black)
          drop-shadow(0 2px 2px rgba(0, 0, 0, 0.5));
      }
    }
  }

  .icon,
  &:before {
    background-size: 80%;
    background-repeat: no-repeat;
    background-position: center 30%;
    position: absolute;
    width: 100%;
    height: 100%;
    margin-top: 3%;
  }

  // Compact: keep classic icon size; name overlays the lower icon
  &.compact .icon,
  &.compact:before {
    filter: drop-shadow(0 0 0.6px #fff) drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85))
      drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.35));
  }

  span {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: 100%;
    pointer-events: none;

    &.leaf-left {
      background-image: url($gstone-leaf-left);
    }

    &.leaf-orange {
      background-image: url($gstone-leaf-orange);
    }

    &.leaf-right {
      background-image: url($gstone-leaf-right);
    }

    &.leaf-top1 {
      background-image: url($gstone-leaf-top1);
    }

    &.leaf-top2 {
      background-image: url($gstone-leaf-top2);
    }

    &.leaf-top3 {
      background-image: url($gstone-leaf-top3);
    }

    &.leaf-top4 {
      background-image: url($gstone-leaf-top4);
    }

    &.leaf-top5 {
      background-image: url($gstone-leaf-top5);
    }
  }

  span.short-name {
    position: absolute;
    left: 50%;
    top: 58%;
    bottom: auto;
    width: auto;
    height: auto;
    transform: translate(-50%, -50%);
    z-index: 2;
    pointer-events: none;
    padding: 0.18em 0.42em;
    background: none;
    font-family: "Noto Serif TC", "Source Han Serif TC", "Songti TC", "PMingLiU",
      serif;
    font-weight: 800;
    font-size: clamp(12px, 30%, 22px);
    line-height: 1;
    letter-spacing: 0.06em;
    white-space: nowrap;
    color: #f7ecd4;
    -webkit-text-stroke: 0.07em rgba(10, 6, 2, 0.92);
    paint-order: stroke fill;
    text-shadow:
      0 0 3px rgba(0, 0, 0, 0.75),
      0 1px 2px rgba(0, 0, 0, 0.7);

    // Soft dark bar behind text for readability on busy parchment
    &::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: -1;
      width: 128%;
      height: 118%;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      background: rgba(18, 10, 4, 0.48);
      box-shadow: 0 0 6px 2px rgba(18, 10, 4, 0.28);
      pointer-events: none;
    }

    &.townsfolk {
      color: lighten($townsfolk, 28%);
    }
    &.outsider {
      color: lighten($outsider, 12%);
    }
    &.minion {
      color: lighten($minion, 16%);
    }
    &.demon {
      color: lighten($demon, 22%);
    }
    &.traveler {
      color: lighten($traveler, 18%);
    }
    &.fabled {
      color: lighten($fabled, 4%);
    }
    &.loric {
      color: lighten($loric, 8%);
    }
  }

  .name {
    width: 100%;
    height: 100%;
    font-size: 30px; // svg fonts are relative to document font size
    .label {
      fill: #0a0705;
      stroke: rgba(255, 246, 220, 0.98);
      stroke-width: 2.35px;
      paint-order: stroke fill;
      font-family: "Noto Serif TC", "Source Han Serif TC", "Songti TC", "PMingLiU",
        "Papyrus", serif;
      font-weight: 800;
      text-shadow: none;
      letter-spacing: 0.2px;

      @-moz-document url-prefix() {
        &.mozilla {
          // Vue doesn't support scoped media queries, so we have to use a second css class
          stroke: none;
          text-shadow: none;
          filter: drop-shadow(0 1.75px 0 #fff6dc)
            drop-shadow(0 -1.75px 0 #fff6dc) drop-shadow(1.75px 0 0 #fff6dc)
            drop-shadow(-1.75px 0 0 #fff6dc)
            drop-shadow(0 1px 1px rgba(0, 0, 0, 0.55));
        }
      }
    }
  }

  .edition {
    position: absolute;
    right: 0;
    bottom: 5px;
    width: 30px;
    height: 30px;
    background-size: 100%;
    display: none;
  }

  .ability {
    display: flex;
    position: absolute;
    padding: 5px 10px;
    left: 120%;
    width: 250px;
    z-index: 25;
    font-size: 80%;
    @include panel-chrome;
    text-align: left;
    justify-items: center;
    align-content: center;
    align-items: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms ease-in-out;

    &:before {
      content: " ";
      border: 10px solid transparent;
      width: 0;
      height: 0;
      border-right-color: $chrome-border;
      position: absolute;
      margin-right: 2px;
      right: 100%;
    }
  }

  &:hover .ability {
    opacity: 1;
  }
}
</style>
