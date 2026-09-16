<template>
  <ul class="info" :style="infoScaleVars">
    <li class="edition" :class="['edition-' + edition.id]" aria-hidden="true">
      <img :src="editionLogo" alt="" />
    </li>
    <li class="script">
      <span class="script-name">{{ $editionName(edition) }}</span>
      <span v-if="editionAuthor" class="script-author">{{
        editionAuthor
      }}</span>
    </li>
    <li class="counts" :title="$t('town.countsTitle')">
      <span>
        {{ players.length }}
        <font-awesome-icon class="players" icon="users" />
      </span>
      <span>
        {{ teams.alive }}
        <font-awesome-icon class="alive" icon="heartbeat" />
      </span>
      <span>
        {{ teams.votes }}
        <font-awesome-icon class="votes" icon="vote-yea" />
      </span>
    </li>
    <li class="setup">
      <span class="townsfolk">{{ setupCounts.townsfolk }}{{ $t("town.teamTownsfolkShort") }}</span>
      <span class="outsider">{{ setupCounts.outsider }}{{ $t("town.teamOutsiderShort") }}</span>
      <span class="minion">{{ setupCounts.minion }}{{ $t("town.teamMinionShort") }}</span>
      <span class="demon">{{ setupCounts.demon }}{{ $t("town.teamDemonShort") }}</span>
      <span v-if="teams.traveler" class="traveler"
        >{{ teams.traveler }}{{ $t("town.teamTravelerShort") }}</span
      >
    </li>
    <li class="phase">{{ currentPhaseLabel }}</li>
    <li class="info-frame" aria-hidden="true"></li>
  </ul>
</template>

<script>
import gameJSON from "./../game";
import { mapGetters, mapState } from "vuex";
import { editionLogoUrl } from "../edition-logos";
import { seatBaseSize } from "../store/viewportLayout";

const INFO_TO_SEAT = 2.5;

export default {
  computed: {
    infoScaleVars() {
      const unit = this.grimoire.unit || "vh";
      const zoom = this.grimoire.zoom || 0;
      const count = (this.players && this.players.length) || 12;
      const seat = Math.max(8, seatBaseSize(count) + zoom);
      const width = seat * INFO_TO_SEAT;
      return {
        "--info-width": width + unit,
        "--info-pad": width * 0.05 + unit,
        "--info-font": width * 0.048 + unit,
        "--info-gap": width * 0.018 + unit
      };
    },
    editionLogo() {
      return editionLogoUrl(this.edition, {
        imageOptIn: this.grimoire.isImageOptIn
      });
    },
    editionAuthor() {
      return (this.edition && this.edition.author) || "";
    },
    currentPhaseLabel() {
      return this.displayLabel || this.$t("town.nightPhase");
    },
    setupCounts() {
      const nonTravelers = this.$store.getters["players/nonTravelers"];
      const row = gameJSON[nonTravelers - 5];
      return {
        townsfolk: (row && row.townsfolk) || 0,
        outsider: (row && row.outsider) || 0,
        minion: (row && row.minion) || 0,
        demon: (row && row.demon) || 0
      };
    },
    teams: function() {
      const { players } = this.$store.state.players;
      const nonTravelers = this.$store.getters["players/nonTravelers"];
      const alive = players.filter(player => player.isDead !== true).length;
      return {
        ...gameJSON[nonTravelers - 5],
        traveler: players.length - nonTravelers,
        alive,
        votes:
          alive +
          players.filter(
            player => player.isDead === true && player.isVoteless !== true
          ).length
      };
    },
    ...mapGetters("gamePhase", ["displayLabel"]),
    ...mapState(["edition", "grimoire"]),
    ...mapState("players", ["players"])
  }
};
</script>

<style lang="scss" scoped>
@import "../vars.scss";

.info {
  position: absolute;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  width: var(--info-width, 35vh);
  max-width: none;
  height: auto;
  padding: 0 var(--info-pad, 1.2vh) var(--info-pad, 1.2vh);
  font-size: var(--info-font, 1.2vh);
  overflow: visible;
  text-align: center;

  li {
    font-weight: bold;
    width: 100%;
    max-width: 100%;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    overflow: visible;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8), 0 -1px 1px rgba(0, 0, 0, 0.8),
      1px 0 1px rgba(0, 0, 0, 0.8), -1px 0 1px rgba(0, 0, 0, 0.8);

    span {
      white-space: nowrap;
      flex: 0 0 auto;
    }

    .players {
      color: #00f700;
    }
    .alive {
      color: #ff4a50;
    }
    .votes {
      color: #fff;
    }
    .townsfolk {
      color: $townsfolk;
    }
    .outsider {
      color: $outsider;
    }
    .minion {
      color: $minion;
    }
    .demon {
      color: $demon;
    }
    .traveler {
      color: $traveler;
    }
  }

  li.edition {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    height: 0;
    max-height: none;
    flex: 0 0 auto;
    align-self: stretch;
    overflow: visible;
    line-height: 0;
    background: none;

    img {
      position: absolute;
      left: 0;
      bottom: 0;
      display: block;
      width: 100%;
      height: auto;
      max-width: none;
      max-height: none;
      object-fit: contain;
      object-position: center bottom;
      pointer-events: none;
    }
  }

  li.script {
    position: relative;
    z-index: 2;
    width: max-content;
    max-width: none;
    overflow: visible;
    align-self: center;
    gap: 0.6em;
    font-weight: 600;
    font-size: 1em;
  }

  .script-name {
    font-family: "Noto Serif TC", "Songti TC", "PMingLiU", serif;
    color: #f2e6d1;
  }

  .script-author {
    font-weight: 500;
    color: $grimoire-muted;
  }

  li.counts {
    gap: 0.55em;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;

    span {
      gap: 0.22em;
    }

    svg {
      margin: 0;
    }
  }

  li.setup {
    gap: 0.45em;
    font-weight: 800;
    font-size: 1.08em;
  }

  li.phase {
    font-weight: 600;
    font-size: 0.88em;
    color: $grimoire-brass-light;
  }
}
</style>
