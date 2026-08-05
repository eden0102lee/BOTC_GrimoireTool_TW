<template>
  <div id="controls">
    <span
      class="nomlog-summary"
      v-show="session.voteHistory.length && session.sessionId"
      @click="toggleModal('voteHistory')"
      :title="$t('nomlog.recent', { count: session.voteHistory.length })"
    >
      <font-awesome-icon icon="book-dead" />
      {{ session.voteHistory.length }}
    </span>
    <span
      class="session"
      :class="{
        spectator: session.isSpectator,
        reconnecting: session.isReconnecting
      }"
      v-if="session.sessionId"
      @click="leaveSession"
      :title="
        $t('tooltip.sessionPlayers', { count: session.playerCount }) +
          (session.ping
            ? $t('tooltip.sessionLatency', { ms: session.ping })
            : '')
      "
    >
      <font-awesome-icon icon="broadcast-tower" />
      {{ session.playerCount }}
    </span>
    <div class="menu" :class="{ open: grimoire.isMenuOpen }">
      <font-awesome-icon icon="cog" @click="toggleMenu" />
      <ul>
        <li class="tabs" :class="tab">
          <font-awesome-icon icon="book-open" @click="tab = 'grimoire'" />
          <font-awesome-icon
            icon="users"
            v-if="!session.isSpectator"
            @click="tab = 'players'"
          />
          <font-awesome-icon icon="theater-masks" @click="tab = 'characters'" />
          <font-awesome-icon
            icon="broadcast-tower"
            @click="tab = 'gstone'"
          />
          <font-awesome-icon icon="question" @click="tab = 'settings'" />
        </li>

        <template v-if="tab === 'grimoire'">
          <li class="headline">{{ $t("menu.game") }}</li>
          <li @click="advancePhase" v-if="!session.isSpectator">
            {{ $t("gamePhase.nextPhase") }}
            <em>[Q]</em>
          </li>
          <li
            @click="retreatPhase"
            v-if="!session.isSpectator"
            :class="{ disabled: !canRetreat }"
            :title="canRetreat ? '' : $t('gamePhase.cannotRetreatEarlier')"
          >
            {{ $t("gamePhase.previousPhase") }}
            <em>[S]</em>
          </li>
          <li @click="toggleModal('reference')">
            {{ $t("menu.referenceSheet") }}
            <em>[R]</em>
          </li>
          <li @click="toggleModal('nightOrder')">
            {{ $t("menu.nightOrderSheet") }}
            <em>[N]</em>
          </li>
          <li
            v-if="session.voteHistory.length || !session.isSpectator"
            @click="toggleModal('voteHistory')"
          >
            {{ $t("menu.voteHistory") }}
            <em>[V]</em>
          </li>
          <li
            @click="toggleRolesHidden"
            v-if="!session.isSpectator && players.length"
          >
            {{
              grimoire.rolesHidden
                ? $t("menu.showRoles")
                : $t("menu.hideRoles")
            }}
            <em>[H]</em>
          </li>
          <template v-if="!session.sessionId">
            <li @click="hostSession" v-if="!session.isSpectator">
              {{ $t("menu.createTown") }}
              <em>[C]</em>
            </li>
            <li @click="joinSession">
              {{ $t("menu.joinTown") }}
              <em>[J]</em>
            </li>
          </template>
          <template v-else>
            <li v-if="session.ping">
              {{
                $t("menu.delayTo", {
                  target: session.isSpectator
                    ? $t("menu.host")
                    : $t("menu.playersLabel")
                })
              }}
              <em>{{ session.ping }}ms</em>
            </li>
            <li
              v-if="!session.isSpectator && session.sessionId"
              class="lan-info"
            >
              {{ $t("menu.lanUrl") }}
              <em>{{ lanPlayUrl }}</em>
            </li>
            <li v-if="session.sessionId">
              {{ $t("menu.roomCode") }}
              <em>{{ session.sessionId }}</em>
            </li>
            <li
              v-if="!session.isSpectator && session.sessionId"
              @click="copyLanUrl"
            >
              {{ $t("menu.copyLanLink") }}
              <em><font-awesome-icon icon="copy"/></em>
            </li>
            <li @click="copySessionUrl">
              {{ $t("menu.copyPlayerLink") }}
              <em><font-awesome-icon icon="copy"/></em>
            </li>
            <li @click="leaveSession">
              {{ $t("menu.leaveSession") }}
              <em>{{ session.sessionId }}</em>
            </li>
          </template>
        </template>

        <template v-if="tab === 'players' && !session.isSpectator">
          <li class="headline">{{ $t("menu.players") }}</li>
          <li @click="addPlayer" v-if="players.length < 20">
            {{ $t("menu.addPlayer") }}<em>[A]</em>
          </li>
          <li @click="randomizeSeatings" v-if="players.length > 2">
            {{ $t("menu.randomize") }}
            <em><font-awesome-icon icon="dice"/></em>
          </li>
          <li @click="clearPlayers" v-if="players.length">
            {{ $t("menu.removeAllPlayers") }}
            <em><font-awesome-icon icon="trash-alt"/></em>
          </li>
        </template>

        <template v-if="tab === 'characters'">
          <li class="headline">{{ $t("menu.characters") }}</li>
          <li v-if="!session.isSpectator" @click="toggleModal('edition')">
            {{ $t("menu.selectEdition") }}
            <em>[P]</em>
          </li>
          <li
            @click="toggleModal('roles')"
            v-if="!session.isSpectator && players.length > 4"
          >
            {{ $t("menu.chooseAssign") }}
            <em>[O]</em>
          </li>
          <li v-if="!session.isSpectator" @click="distributeRoles">
            {{ $t("menu.sendCharacters") }}
            <em>[I]</em>
          </li>
          <li v-if="!session.isSpectator" @click="toggleModal('fabled')">
            {{ $t("menu.addFabled") }}
            <em>[L]</em>
          </li>
          <li @click="clearRoles" v-if="players.length">
            {{ $t("menu.removeAllRoles") }}
            <em><font-awesome-icon icon="trash-alt"/></em>
          </li>
          <li @click="clearBattleLog" v-if="!session.isSpectator">
            {{ $t("menu.deleteBattleLog") }}
            <em><font-awesome-icon icon="trash-alt"/></em>
          </li>
          <li @click="clearReminders" v-if="hasAnyReminders">
            {{ $t("menu.removeAllReminders") }}
            <em><font-awesome-icon icon="trash-alt"/></em>
          </li>
          <li @click="restartNewGame" v-if="!session.isSpectator && players.length">
            {{ $t("menu.restartNewGame") }}
            <em><font-awesome-icon icon="redo-alt"/></em>
          </li>
        </template>

        <template v-if="tab === 'gstone'">
          <li class="headline">{{ $t("menu.gstone") }}</li>
          <li class="disclaimer">{{ $t("menu.disclaimer") }}</li>
          <li>
            <a href="https://botc.app/" target="_blank" rel="noopener">
              {{ $t("menu.linkOfficialGrimoire") }}
            </a>
            <em>
              <a href="https://botc.app/" target="_blank" rel="noopener">
                <font-awesome-icon icon="external-link-alt" />
              </a>
            </em>
          </li>
          <li>
            <a
              href="https://clocktower.gstonegames.com/grimoire/"
              target="_blank"
              rel="noopener"
            >
              {{ $t("menu.linkGstoneGrimoire") }}
            </a>
            <em>
              <a
                href="https://clocktower.gstonegames.com/grimoire/"
                target="_blank"
                rel="noopener"
              >
                <font-awesome-icon icon="external-link-alt" />
              </a>
            </em>
          </li>
          <li>
            <a
              href="https://clocktower.gstonegames.com/script_tool/"
              target="_blank"
              rel="noopener"
            >
              {{ $t("menu.linkScriptTool") }}
            </a>
            <em>
              <a
                href="https://clocktower.gstonegames.com/script_tool/"
                target="_blank"
                rel="noopener"
              >
                <font-awesome-icon icon="external-link-alt" />
              </a>
            </em>
          </li>
        </template>

        <template v-if="tab === 'settings'">
          <li class="headline">{{ $t("menu.settings") }}</li>
          <li @click="toggleNightOrder" v-if="players.length">
            {{ $t("menu.nightOrder") }}
            <em>
              <font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.isNightOrder ? 'check-square' : 'square'
                ]"
              />
            </em>
          </li>
          <li v-if="players.length">
            {{ $t("menu.zoom") }}
            <em>
              <font-awesome-icon
                @click="setZoom(grimoire.zoom - 1)"
                icon="search-minus"
              />
              {{ Math.round(100 + grimoire.zoom * 10) }}%
              <font-awesome-icon
                @click="setZoom(grimoire.zoom + 1)"
                icon="search-plus"
              />
            </em>
          </li>
          <li @click="setBackground">
            {{ $t("menu.background") }}
            <em><font-awesome-icon icon="image"/></em>
          </li>
          <li v-if="!edition.isOfficial" @click="imageOptIn">
            <small>{{ $t("menu.showCustomImages") }}</small>
            <em
              ><font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.isImageOptIn ? 'check-square' : 'square'
                ]"
            /></em>
          </li>
          <li @click="toggleStatic">
            {{ $t("menu.disableAnimations") }}
            <em
              ><font-awesome-icon
                :icon="['fas', grimoire.isStatic ? 'check-square' : 'square']"
            /></em>
          </li>
          <li @click="toggleMuted">
            {{ $t("menu.muteSounds") }}
            <em
              ><font-awesome-icon
                :icon="['fas', grimoire.isMuted ? 'volume-mute' : 'volume-up']"
            /></em>
          </li>
          <li @click="toggleModal('battleLog')">
            {{ $t("menu.battleLog") }}
            <em>[B]</em>
          </li>
          <li @click="toggleModal('interactionRules')">
            {{ $t("menu.interactionRules") }}
          </li>
          <li @click="toggleModal('gameState')">
            {{ $t("menu.gameStateJson") }}
            <em><font-awesome-icon icon="file-code"/></em>
          </li>
          <li>
            <a href="https://github.com/bra1n/townsquare" target="_blank">
              {{ $t("menu.sourceCode") }}
            </a>
            <em>
              <a href="https://github.com/bra1n/townsquare" target="_blank">
                <font-awesome-icon :icon="['fab', 'github']" />
              </a>
            </em>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from "vuex";

export default {
  computed: {
    ...mapState(["grimoire", "session", "edition"]),
    ...mapState("players", ["players"]),
    ...mapGetters("gamePhase", ["canRetreat"]),
    hasAnyReminders() {
      return this.players.some(
        (player) => player.reminders && player.reminders.length > 0,
      );
    },
  },
  data() {
    return {
      tab: "grimoire",
      lanPlayUrl: "",
      hostInfo: null
    };
  },
  mounted() {
    this.fetchHostInfo();
  },
  watch: {
    "session.sessionId"() {
      this.updateLanUrl();
    }
  },
  methods: {
    clearBattleLog() {
      if (!window.confirm(this.$t("confirm.deleteBattleLog"))) return;
      this.$store.dispatch("battleLog/resetForNewGame");
    },
    restartNewGame() {
      if (!window.confirm(this.$t("confirm.restartNewGame"))) return;
      this.$store.dispatch("players/clearRoles");
      this.$store.dispatch("battleLog/resetForNewGame");
    },
    setBackground() {
      const background = prompt(this.$t("prompt.backgroundUrl"));
      if (background || background === "") {
        this.$store.commit("setBackground", background);
      }
    },
    hostSession() {
      if (this.session.sessionId) return;
      const sessionId = prompt(
        this.$t("prompt.sessionIdHost"),
        Math.round(Math.random() * 10000)
      );
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        this.$store.commit("session/setSpectator", false);
        this.$store.commit("session/setSessionId", sessionId);
        this.updateLanUrl();
        this.copySessionUrl();
      }
    },
    async fetchHostInfo() {
      try {
        const res = await fetch("/api/host-info");
        if (res.ok) this.hostInfo = await res.json();
      } catch (e) {
        this.hostInfo = null;
      }
      this.updateLanUrl();
    },
    updateLanUrl() {
      const base = this.hostInfo
        ? `http://${this.hostInfo.lanIp}:${this.hostInfo.httpPort}/`
        : window.location.href.split("#")[0];
      this.lanPlayUrl =
        base.replace(/\/$/, "") +
        (this.session.sessionId ? "#" + this.session.sessionId : "");
    },
    copyLanUrl() {
      this.updateLanUrl();
      navigator.clipboard.writeText(this.lanPlayUrl);
    },
    copySessionUrl() {
      const url = window.location.href.split("#")[0];
      const link = url + "#" + this.session.sessionId;
      navigator.clipboard.writeText(link);
    },
    distributeRoles() {
      if (this.session.isSpectator) return;
      if (confirm(this.$t("confirm.distributeRoles"))) {
        this.$store.commit("session/distributeRoles", true);
        setTimeout(
          (() => {
            this.$store.commit("session/distributeRoles", false);
          }).bind(this),
          2000
        );
      }
    },
    imageOptIn() {
      if (this.grimoire.isImageOptIn || confirm(this.$t("confirm.customImages"))) {
        this.toggleImageOptIn();
      }
    },
    joinSession() {
      if (this.session.sessionId) return this.leaveSession();
      let sessionId = prompt(this.$t("prompt.sessionIdJoin"));
      if (sessionId.match(/^https?:\/\//i)) {
        sessionId = sessionId.split("#").pop();
      }
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        this.$store.commit("session/setSpectator", true);
        this.$store.commit("session/setSessionId", sessionId);
        this.updateLanUrl();
      }
    },
    leaveSession() {
      if (confirm(this.$t("confirm.leaveSession"))) {
        this.$store.commit("session/setSpectator", false);
        this.$store.commit("session/setSessionId", "");
      }
    },
    addPlayer() {
      if (this.session.isSpectator) return;
      if (this.players.length >= 20) return;
      this.$store.commit("players/add");
    },
    randomizeSeatings() {
      if (this.session.isSpectator) return;
      if (confirm(this.$t("confirm.randomizeSeatings"))) {
        this.$store.dispatch("players/randomize");
      }
    },
    clearPlayers() {
      if (this.session.isSpectator) return;
      if (confirm(this.$t("confirm.removeAllPlayers"))) {
        if (this.session.nomination) {
          this.$store.commit("session/nomination");
        }
        this.$store.commit("players/clear");
      }
    },
    clearRoles() {
      if (confirm(this.$t("confirm.removeAllRoles"))) {
        this.$store.dispatch("players/clearRoles");
      }
    },
    clearReminders() {
      if (confirm(this.$t("confirm.removeAllReminders"))) {
        this.$store.dispatch("players/clearReminders");
      }
    },
    advancePhase() {
      this.$store.dispatch("gamePhase/advance");
    },
    retreatPhase() {
      if (!this.canRetreat) return;
      this.$store.dispatch("gamePhase/retreat");
    },
    ...mapMutations([
      "toggleMenu",
      "toggleImageOptIn",
      "toggleMuted",
      "toggleNightOrder",
      "toggleRolesHidden",
      "toggleStatic",
      "setZoom",
      "toggleModal"
    ])
  }
};
</script>

<style scoped lang="scss">
@import "../vars.scss";

// success animation
@keyframes greenToWhite {
  from {
    color: green;
  }
  to {
    color: white;
  }
}

// Controls
#controls {
  position: absolute;
  right: max(3px, env(safe-area-inset-right, 0px));
  top: max(3px, env(safe-area-inset-top, 0px));
  text-align: right;
  padding-right: max(50px, calc(40px + env(safe-area-inset-right, 0px)));
  z-index: 75;

  svg {
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
    &.success {
      animation: greenToWhite 1s normal forwards;
      animation-iteration-count: 1;
    }
  }

  > span {
    display: inline-block;
    cursor: pointer;
    z-index: 5;
    margin-top: 7px;
    margin-left: 10px;
    min-height: 44px;
    min-width: 44px;
    line-height: 44px;
    text-align: center;
  }

  span.nomlog-summary {
    color: $townsfolk;
  }

  span.session {
    color: $demon;
    &.spectator {
      color: $townsfolk;
    }
    &.reconnecting {
      animation: blink 1s infinite;
    }
  }
}

@keyframes blink {
  50% {
    opacity: 0.5;
    color: gray;
  }
}

.menu {
  width: min(
    240px,
    calc(100vw - 24px - env(safe-area-inset-right, 0px))
  );
  transform-origin: calc(100% - 20px) 22px;
  transition: transform 500ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform: rotate(-90deg);
  position: absolute;
  right: 0;
  top: 0;

  &.open {
    transform: rotate(0deg);
  }

  > svg {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid black;
    width: 44px;
    height: 50px;
    margin-bottom: -8px;
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    padding: 5px 5px 15px;
  }

  a {
    color: white;
    text-decoration: none;
    &:hover {
      color: red;
    }
  }

  ul {
    display: flex;
    list-style-type: none;
    padding: 0;
    margin: 0;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 0 10px black;
    border: 3px solid black;
    border-radius: 10px 0 10px 10px;

    li {
      padding: 4px 8px;
      color: white;
      text-align: left;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 44px;

      &.tabs {
        display: flex;
        padding: 0;
        svg {
          flex-grow: 1;
          flex-shrink: 0;
          height: 44px;
          border-bottom: 3px solid black;
          border-right: 3px solid black;
          padding: 8px 0;
          cursor: pointer;
          transition: color 250ms;
          &:hover {
            color: red;
          }
          &:last-child {
            border-right: 0;
          }
        }
        &.grimoire .fa-book-open,
        &.players .fa-users,
        &.characters .fa-theater-masks,
        &.gstone .fa-broadcast-tower,
        &.settings .fa-question {
          background: linear-gradient(
            to bottom,
            $townsfolk 0%,
            rgba(0, 0, 0, 0.5) 100%
          );
        }
      }

      &:not(.headline):not(.tabs):not(.disclaimer):hover {
        cursor: pointer;
        color: red;
      }

      &.disabled {
        opacity: 0.45;
        cursor: not-allowed;
        &:hover {
          color: white;
        }
      }

      em {
        flex-grow: 0;
        font-style: normal;
        margin-left: 10px;
        font-size: 80%;
      }
    }

    .headline {
      font-family: PiratesBay, sans-serif;
      letter-spacing: 1px;
      padding: 0 10px;
      text-align: center;
      justify-content: center;
      background: linear-gradient(
        to right,
        $townsfolk 0%,
        rgba(0, 0, 0, 0.5) 20%,
        rgba(0, 0, 0, 0.5) 80%,
        $demon 100%
      );
    }

    .disclaimer {
      display: block;
      font-size: 70%;
      line-height: 1.35;
      opacity: 0.85;
      min-height: 0;
      padding: 8px;
      cursor: default;
      white-space: normal;
      text-align: left;

      &:hover {
        color: white;
      }
    }

    .lan-info {
      em {
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 70%;
      }
    }

    .hint {
      font-size: 80%;
      opacity: 0.75;
      justify-content: center;
      cursor: default;

      &:hover {
        color: white;
      }
    }
  }
}
</style>
