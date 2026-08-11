<template>
  <section class="intro" aria-labelledby="intro-title">
    <div class="ritual" aria-hidden="true">
      <div class="ritual-ring ritual-ring-outer"></div>
      <div class="ritual-ring ritual-ring-inner"></div>
      <span class="ritual-tick tick-n"></span>
      <span class="ritual-tick tick-e"></span>
      <span class="ritual-tick tick-s"></span>
      <span class="ritual-tick tick-w"></span>

      <div
        v-for="role in heroRoles"
        :key="role.id"
        class="role-sigil"
        :class="[`role-${role.team}`, role.position]"
      >
        <span
          class="role-icon"
          :style="{ backgroundImage: `url(${role.icon})` }"
        ></span>
      </div>
    </div>

    <div class="intro-card">
      <div class="eyebrow">STORYTELLER'S GRIMOIRE</div>
      <div class="title-ornament" aria-hidden="true">
        <span></span><i>◆</i><span></span>
      </div>
      <h1 id="intro-title">血染鐘樓</h1>
      <div class="subtitle">繁中魔典</div>
      <p class="welcome">
        {{ $t("intro.welcome") }}<br />
        {{ $t("intro.addPlayers") }}
      </p>

      <button type="button" class="button intro-action" @click="toggleMenu">
        <font-awesome-icon icon="cog" />
        <span>開啟魔典選單</span>
      </button>

      <div class="disclaimer">{{ $t("menu.disclaimer") }}</div>
    </div>
  </section>
</template>

<script>
import { mapMutations } from "vuex";

const icons = require.context("../assets/icons", false, /\.png$/);
const roleIcon = id => icons(`./${id}.png`);

export default {
  data() {
    return {
      heroRoles: [
        { id: "washerwoman", team: "townsfolk", position: "p1", icon: roleIcon("washerwoman") },
        { id: "librarian", team: "townsfolk", position: "p2", icon: roleIcon("librarian") },
        { id: "empath", team: "townsfolk", position: "p3", icon: roleIcon("empath") },
        { id: "fortuneteller", team: "townsfolk", position: "p4", icon: roleIcon("fortuneteller") },
        { id: "monk", team: "townsfolk", position: "p5", icon: roleIcon("monk") },
        { id: "poisoner", team: "minion", position: "p6", icon: roleIcon("poisoner") },
        { id: "spy", team: "minion", position: "p7", icon: roleIcon("spy") },
        { id: "imp", team: "demon", position: "p8", icon: roleIcon("imp") }
      ]
    };
  },
  methods: mapMutations(["toggleMenu"])
};
</script>

<style scoped lang="scss">
@import "../vars.scss";

.intro {
  width: min(92vw, 780px);
  height: min(88vh, 760px);
  min-height: 460px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 3;
  pointer-events: none;
}

.ritual {
  position: absolute;
  width: min(72vmin, 660px);
  height: min(72vmin, 660px);
  border-radius: 50%;
  pointer-events: none;
  filter: drop-shadow(0 16px 35px rgba(0, 0, 0, 0.45));
}

.ritual-ring {
  position: absolute;
  border-radius: 50%;
  inset: 0;
  border: 1px solid rgba($grimoire-brass, 0.3);
  box-shadow:
    inset 0 0 45px rgba($grimoire-blood, 0.09),
    0 0 24px rgba($grimoire-brass, 0.05);
}

.ritual-ring-outer:before,
.ritual-ring-outer:after,
.ritual-ring-inner:before,
.ritual-ring-inner:after {
  content: "";
  position: absolute;
  border-radius: inherit;
  inset: 4.5%;
  border: 1px solid rgba($grimoire-brass, 0.1);
}

.ritual-ring-outer:after {
  inset: 11%;
  border-style: dashed;
  border-color: rgba($grimoire-brass-light, 0.12);
}

.ritual-ring-inner {
  inset: 21%;
  border-color: rgba($grimoire-brass, 0.14);
}

.ritual-ring-inner:before {
  inset: 12%;
}

.ritual-ring-inner:after {
  inset: 25%;
  border-color: rgba($grimoire-blood-bright, 0.14);
}

.ritual-tick {
  position: absolute;
  width: 1px;
  height: 12%;
  left: 50%;
  top: -2%;
  background: linear-gradient(to bottom, rgba($grimoire-brass, 0.65), transparent);
  transform-origin: 50% 435%;
}

.tick-e { transform: rotate(90deg); }
.tick-s { transform: rotate(180deg); }
.tick-w { transform: rotate(270deg); }

.role-sigil {
  --token-size: clamp(54px, 10vmin, 92px);
  position: absolute;
  width: var(--token-size);
  height: var(--token-size);
  left: calc(50% - var(--token-size) / 2);
  top: calc(50% - var(--token-size) / 2);
  border-radius: 50%;
  padding: 6px;
  background:
    radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.08), transparent 32%),
    rgba(13, 10, 9, 0.86);
  border: 1px solid rgba($grimoire-brass, 0.52);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.48),
    inset 0 0 0 2px rgba(0, 0, 0, 0.52);
  opacity: 0.86;
}

.role-icon {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 78%;
  filter: saturate(0.82) contrast(1.04);
}

.role-townsfolk { box-shadow: 0 8px 20px rgba(0,0,0,.48), 0 0 18px rgba($townsfolk,.11), inset 0 0 0 2px rgba(0,0,0,.52); }
.role-minion { box-shadow: 0 8px 20px rgba(0,0,0,.48), 0 0 18px rgba($minion,.12), inset 0 0 0 2px rgba(0,0,0,.52); }
.role-demon { box-shadow: 0 8px 20px rgba(0,0,0,.48), 0 0 24px rgba($demon,.2), inset 0 0 0 2px rgba(0,0,0,.52); }

.p1 { transform: rotate(0deg) translateY(-46%) translateY(calc(min(72vmin, 660px) * -0.5)) rotate(0deg); }
.p2 { transform: rotate(45deg) translateY(-46%) translateY(calc(min(72vmin, 660px) * -0.5)) rotate(-45deg); }
.p3 { transform: rotate(90deg) translateY(-46%) translateY(calc(min(72vmin, 660px) * -0.5)) rotate(-90deg); }
.p4 { transform: rotate(135deg) translateY(-46%) translateY(calc(min(72vmin, 660px) * -0.5)) rotate(-135deg); }
.p5 { transform: rotate(180deg) translateY(-46%) translateY(calc(min(72vmin, 660px) * -0.5)) rotate(-180deg); }
.p6 { transform: rotate(225deg) translateY(-46%) translateY(calc(min(72vmin, 660px) * -0.5)) rotate(-225deg); }
.p7 { transform: rotate(270deg) translateY(-46%) translateY(calc(min(72vmin, 660px) * -0.5)) rotate(-270deg); }
.p8 { transform: rotate(315deg) translateY(-46%) translateY(calc(min(72vmin, 660px) * -0.5)) rotate(-315deg); }

.intro-card {
  pointer-events: auto;
  width: min(82vw, 430px);
  padding: clamp(24px, 4vmin, 40px) clamp(20px, 4vmin, 38px) 20px;
  color: $grimoire-text;
  background:
    linear-gradient(135deg, rgba(255, 240, 208, 0.025), transparent 38%),
    rgba(10, 8, 7, 0.91);
  border: 1px solid rgba($grimoire-brass, 0.56);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.58),
    inset 0 0 0 1px rgba(0, 0, 0, 0.72),
    inset 0 0 70px rgba($grimoire-blood, 0.08);
  backdrop-filter: blur(12px);
}

.intro-card:before,
.intro-card:after {
  content: "◆";
  position: absolute;
  color: rgba($grimoire-brass-light, 0.58);
  font-size: 9px;
  top: 9px;
}

.intro-card:before { left: 11px; }
.intro-card:after { right: 11px; }

.eyebrow {
  font-size: clamp(0.52rem, 1.5vw, 0.68rem);
  letter-spacing: 0.28em;
  color: $grimoire-muted;
  text-transform: uppercase;
}

.title-ornament {
  margin: 10px auto 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 70%;
  color: $grimoire-brass;
}

.title-ornament span {
  height: 1px;
  flex: 1;
  background: linear-gradient(to right, transparent, rgba($grimoire-brass, 0.72));
}

.title-ornament span:last-child {
  background: linear-gradient(to left, transparent, rgba($grimoire-brass, 0.72));
}

.title-ornament i {
  font-style: normal;
  font-size: 8px;
}

h1 {
  font-family: "Noto Serif TC", "Songti TC", "PMingLiU", serif;
  font-size: clamp(2.1rem, 7.4vw, 3.6rem);
  line-height: 1.12;
  letter-spacing: 0.18em;
  margin-left: 0.18em;
  color: #f2e6d1;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.72);
}

.subtitle {
  margin-top: 5px;
  color: $grimoire-brass-light;
  font-family: "Noto Serif TC", "Songti TC", "PMingLiU", serif;
  font-size: clamp(0.9rem, 2.8vw, 1.15rem);
  letter-spacing: 0.42em;
  margin-left: 0.42em;
}

.welcome {
  margin: 18px 0 15px;
  color: rgba($grimoire-text, 0.8);
  font-size: clamp(0.72rem, 2.1vw, 0.9rem);
  line-height: 1.55;
}

.intro-action {
  width: min(100%, 290px);
  min-height: 46px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  margin: 1px auto 3px;
}

.disclaimer {
  font-size: clamp(0.5rem, 1.5vw, 0.62rem);
  line-height: 1.35;
  color: rgba($grimoire-muted, 0.72);
  margin-top: 14px;
  white-space: normal;
}

@media screen and (max-width: 767.98px) {
  .intro {
    width: 100vw;
    height: 100%;
    min-height: 0;
  }

  .ritual {
    width: min(90vw, 520px);
    height: min(90vw, 520px);
  }

  .role-sigil {
    --token-size: clamp(44px, 14vw, 66px);
  }

  .p1 { transform: translateY(-43vw); }
  .p2 { transform: translate(30vw, -30vw); }
  .p3 { transform: translateX(43vw); }
  .p4 { transform: translate(30vw, 30vw); }
  .p5 { transform: translateY(43vw); }
  .p6 { transform: translate(-30vw, 30vw); }
  .p7 { transform: translateX(-43vw); }
  .p8 { transform: translate(-30vw, -30vw); }

  .intro-card {
    width: min(76vw, 360px);
    padding: 22px 18px 16px;
  }

  .welcome {
    margin: 12px 0;
  }
}

@media screen and (max-height: 620px) {
  .ritual {
    width: min(76vh, 560px);
    height: min(76vh, 560px);
  }

  .role-sigil {
    --token-size: clamp(42px, 10vh, 62px);
  }

  .intro-card {
    padding-top: 18px;
    padding-bottom: 12px;
  }

  .eyebrow,
  .welcome {
    display: none;
  }

  .disclaimer {
    margin-top: 8px;
  }
}
</style>
