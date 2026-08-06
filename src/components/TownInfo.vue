<template>
  <ul class="info">
    <li
      class="edition"
      :class="['edition-' + edition.id]"
      :style="{
        backgroundImage: `url(${editionLogo})`
      }"
    ></li>
    <li v-if="players.length - teams.traveler < 5">
      {{ $t("town.addMorePlayers") }}
    </li>
    <li>
      <span class="meta" v-if="!edition.isOfficial">
        {{ $editionName(edition) }}
        {{ edition.author ? $t("town.by") + " " + edition.author : "" }}
      </span>
      <span>
        {{ players.length }} <font-awesome-icon class="players" icon="users" />
      </span>
      <span>
        {{ teams.alive }}
        <font-awesome-icon class="alive" icon="heartbeat" />
      </span>
      <span>
        {{ teams.votes }} <font-awesome-icon class="votes" icon="vote-yea" />
      </span>
    </li>
    <li v-if="players.length - teams.traveler >= 5">
      <span>
        {{ teams.townsfolk }}
        <font-awesome-icon class="townsfolk" icon="user-friends" />
      </span>
      <span>
        {{ teams.outsider }}
        <font-awesome-icon
          class="outsider"
          :icon="teams.outsider > 1 ? 'user-friends' : 'user'"
        />
      </span>
      <span>
        {{ teams.minion }}
        <font-awesome-icon
          class="minion"
          :icon="teams.minion > 1 ? 'user-friends' : 'user'"
        />
      </span>
      <span>
        {{ teams.demon }}
        <font-awesome-icon
          class="demon"
          :icon="teams.demon > 1 ? 'user-friends' : 'user'"
        />
      </span>
      <span v-if="teams.traveler">
        {{ teams.traveler }}
        <font-awesome-icon
          class="traveler"
          :icon="teams.traveler > 1 ? 'user-friends' : 'user'"
        />
      </span>
      <span v-if="grimoire.isNight">
        {{ $t("town.nightPhase") }}
        <font-awesome-icon :icon="['fas', 'cloud-moon']" />
      </span>
    </li>
  </ul>
</template>

<script>
import gameJSON from "./../game";
import { mapState } from "vuex";
import { editionLogoUrl } from "../edition-logos";

export default {
  computed: {
    editionLogo() {
      return editionLogoUrl(this.edition, {
        imageOptIn: this.grimoire.isImageOptIn
      });
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
  width: 20%;
  height: 20%;
  padding: 50px 0 0;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;

  li {
    font-weight: bold;
    width: 100%;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8), 0 -1px 1px rgba(0, 0, 0, 0.8),
      1px 0 1px rgba(0, 0, 0, 0.8), -1px 0 1px rgba(0, 0, 0, 0.8);

    span {
      white-space: nowrap;
    }

    .meta {
      text-align: center;
      flex-basis: 100%;
      font-family: PiratesBay, sans-serif;
      font-weight: normal;
    }

    svg {
      margin-right: 10px;
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
    width: clamp(72px, 22vmin, 220px);
    height: clamp(66px, 20vmin, 200px);
    max-width: 100%;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    position: absolute;
    top: -25%;
  }
}

@media screen and (max-width: 991.98px) {
  .info {
    width: min(180px, 36vw);
    height: auto;
    padding: 28px 0 0;
    font-size: 90%;
  }
  .info li.edition {
    width: clamp(64px, 28vw, 160px);
    height: clamp(58px, 25vw, 145px);
    top: -18%;
  }
}

@media screen and (max-width: 767.98px) {
  .info {
    width: min(140px, 44vw);
    padding: 16px 0 0;
    font-size: 78%;
    pointer-events: none;
  }
  .info li {
    span {
      margin: 0 4px;
    }
    svg {
      margin-right: 4px;
    }
  }
  .info li.edition {
    width: clamp(56px, 30vw, 130px);
    height: clamp(50px, 27vw, 118px);
    top: -14%;
  }
}

@media screen and (max-height: 600px) {
  .info li.edition {
    width: clamp(48px, 18vmin, 120px);
    height: clamp(44px, 16vmin, 110px);
    top: -12%;
  }
}
</style>
