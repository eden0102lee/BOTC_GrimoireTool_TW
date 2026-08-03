<template>
  <li :style="zoom" :class="seatHighlightClass">
    <div
      ref="player"
      class="player"
      :class="[
        {
          dead: player.isDead,
          marked: session.markedPlayer === index,
          'no-vote': player.isVoteless,
          you: session.sessionId && player.id && player.id === session.playerId,
          'vote-yes': session.votes[index],
          'vote-lock': voteLocked,
          'battle-log-pending': hasOpenPending,
          'battle-log-preview': hasPreviewEffects,
        },
        player.role.team
      ]"
    >
      <div class="shroud" @click="toggleStatus()"></div>
      <div
        v-if="previewDead && !player.isDead"
        class="shroud preview-ghost"
        aria-hidden="true"
      ></div>
      <div class="life" @click="toggleStatus()"></div>
      <span
        v-if="hasOpenPending && linkedMode"
        class="pending-badge"
        :title="$t('recorder.pendingSeatHint')"
        >?</span
      >

      <div
        class="night-order first"
        v-if="nightOrder.get(player).first && grimoire.isNightOrder"
      >
        <em>{{ nightOrder.get(player).first }}.</em>
        <span
          v-if="player.role.firstNightReminder"
          :data-label="$t('nightOrder.firstNightLabel')"
          >{{ player.role.firstNightReminder }}</span
        >
      </div>
      <div
        class="night-order other"
        v-if="nightOrder.get(player).other && grimoire.isNightOrder"
      >
        <em>{{ nightOrder.get(player).other }}.</em>
        <span
          v-if="player.role.otherNightReminder"
          :data-label="$t('nightOrder.otherNightsLabel')"
          >{{ player.role.otherNightReminder }}</span
        >
      </div>

      <Token
        :role="player.role"
        @set-role="$emit('trigger', ['openRoleModal'])"
      />

      <!-- Overlay icons -->
      <div class="overlay">
        <font-awesome-icon
          icon="hand-paper"
          class="vote"
          :title="$t('player.handUp')"
          @click="vote()"
        />
        <font-awesome-icon
          icon="times"
          class="vote"
          :title="$t('player.handDown')"
          @click="vote()"
        />
        <font-awesome-icon
          icon="times-circle"
          class="cancel"
          :title="$t('player.cancel')"
          @click="cancel()"
        />
        <font-awesome-icon
          icon="exchange-alt"
          class="swap"
          @click="swapPlayer(player)"
          :title="$t('player.swapSeats')"
        />
        <font-awesome-icon
          icon="redo-alt"
          class="move"
          @click="movePlayer(player)"
          :title="$t('player.moveToSeat')"
        />
        <font-awesome-icon
          icon="hand-point-right"
          class="nominate"
          @click="nominatePlayer(player)"
          :title="$t('player.nominate')"
        />
      </div>

      <!-- Claimed seat icon -->
      <font-awesome-icon
        icon="chair"
        v-if="player.id && session.sessionId"
        class="seat"
        :class="{ highlight: session.isRolesDistributed }"
      />

      <!-- Ghost vote icon -->
      <font-awesome-icon
        icon="vote-yea"
        class="has-vote"
        v-if="player.isDead && !player.isVoteless"
        @click="updatePlayer('isVoteless', true)"
        :title="$t('player.ghostVote')"
      />

      <!-- On block icon -->
      <div class="marked">
        <font-awesome-icon icon="skull" />
      </div>
      <div
        class="name"
        @click="isMenuOpen = !isMenuOpen"
        :class="{ active: isMenuOpen }"
      >
        <span>{{ player.name }}</span>
      </div>

      <transition name="fold">
        <ul class="menu" v-if="isMenuOpen">
          <template v-if="!session.isSpectator">
            <li @click="changeName">
              <font-awesome-icon icon="user-edit" />{{ $t("player.rename") }}
            </li>
            <li @click="movePlayer()" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="redo-alt" />
              {{ $t("player.move") }}
            </li>
            <li @click="swapPlayer()" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="exchange-alt" />
              {{ $t("player.swap") }}
            </li>
            <li @click="removePlayer" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="times-circle" />
              {{ $t("player.remove") }}
            </li>
            <li
              @click="updatePlayer('id', '', true)"
              v-if="player.id && session.sessionId"
            >
              <font-awesome-icon icon="chair" />
              {{ $t("player.emptySeat") }}
            </li>
            <template v-if="!session.nomination">
              <li @click="nominatePlayer()">
                <font-awesome-icon icon="hand-point-right" />
                {{ $t("player.nomination") }}
              </li>
            </template>
          </template>
          <li
            @click="claimSeat"
            v-if="session.isSpectator"
            :class="{ disabled: player.id && player.id !== session.playerId }"
          >
            <font-awesome-icon icon="chair" />
            <template v-if="!player.id">
              {{ $t("player.claimSeat") }}
            </template>
            <template v-else-if="player.id === session.playerId">
              {{ $t("player.vacateSeat") }}
            </template>
            <template v-else> {{ $t("player.seatOccupied") }}</template>
          </li>
        </ul>
      </transition>
    </div>

    <template v-if="player.reminders">
      <div
        class="reminder"
        :key="reminder.role + ' ' + reminder.name"
        v-for="reminder in player.reminders"
        :class="[reminder.role]"
        @click="removeReminder(reminder)"
      >
        <span
          class="icon"
          :style="{
            backgroundImage: `url(${
              reminder.image && grimoire.isImageOptIn
                ? reminder.image
                : require('../assets/icons/' +
                    (reminder.imageAlt || reminder.role) +
                    '.png')
            })`
          }"
        ></span>
        <span class="text">{{ reminder.name }}</span>
      </div>
    </template>
    <div
      v-for="(ghost, gi) in previewReminders"
      :key="'ghost-' + gi"
      class="reminder preview-ghost-reminder"
      :class="[ghost.reminder.role]"
    >
      <span
        class="icon"
        :style="{
          backgroundImage: `url(${require('../assets/icons/' +
            (ghost.reminder.imageAlt || ghost.reminder.role) +
            '.png')})`
        }"
      ></span>
      <span class="text">{{ ghost.reminder.name }}</span>
    </div>
    <div class="reminder add" @click="$emit('trigger', ['openReminderModal'])">
      <span class="icon"></span>
    </div>
    <div class="reminderHoverTarget"></div>
  </li>
</template>

<script>
import Token from "./Token";
import { mapGetters, mapState } from "vuex";

export default {
  components: {
    Token
  },
  props: {
    player: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState("players", ["players"]),
    ...mapState(["grimoire", "session"]),
    ...mapState("battleLog", ["linkedMode", "previewEffects"]),
    ...mapGetters(["hideRolesOnBoard"]),
    ...mapGetters({ nightOrder: "players/nightOrder" }),
    ...mapGetters("battleLog", {
      pendingForPlayer: "pendingForPlayerIndex",
      previewForPlayer: "previewForPlayerIndex",
    }),
    index: function() {
      return this.players.indexOf(this.player);
    },
    hasOpenPending() {
      if (!this.linkedMode) return false;
      return this.pendingForPlayer(this.index).length > 0;
    },
    hasPreviewEffects() {
      if (!this.linkedMode) return false;
      return this.previewForPlayer(this.index).length > 0;
    },
    previewDead() {
      return this.previewForPlayer(this.index).some(
        (e) => e.type === "setDead" && e.value,
      );
    },
    previewReminders() {
      return this.previewForPlayer(this.index)
        .filter((e) => e.type === "addReminder")
        .map((e) => ({ reminder: e.reminder }));
    },
    seatHighlightClass() {
      if (this.hasOpenPending) return "seat-pending";
      if (this.hasPreviewEffects) return "seat-preview";
      return "";
    },
    voteLocked: function() {
      const session = this.session;
      const players = this.players.length;
      if (!session.nomination) return false;
      const indexAdjusted =
        (this.index - 1 + players - session.nomination[1]) % players;
      return indexAdjusted < session.lockedVote - 1;
    },
    zoom: function() {
      const unit = this.grimoire.unit;
      const count = this.players.length;
      if (count < 7) {
        return { width: 18 + this.grimoire.zoom + unit };
      } else if (count <= 10) {
        return { width: 16 + this.grimoire.zoom + unit };
      } else if (count <= 15) {
        return { width: 14 + this.grimoire.zoom + unit };
      } else {
        return { width: 12 + this.grimoire.zoom + unit };
      }
    },
  },
  data() {
    return {
      isMenuOpen: false,
      isSwap: false
    };
  },
  methods: {
    toggleStatus() {
      if (this.hideRolesOnBoard && !this.session.isSpectator) {
        if (!this.player.isDead) {
          this.updatePlayer("isDead", true);
          if (this.player.isMarked) {
            this.updatePlayer("isMarked", false);
          }
        } else if (this.player.isVoteless) {
          this.updatePlayer("isVoteless", false);
          this.updatePlayer("isDead", false);
        } else {
          this.updatePlayer("isVoteless", true);
        }
      } else {
        this.updatePlayer("isDead", !this.player.isDead);
        if (this.player.isMarked) {
          this.updatePlayer("isMarked", false);
        }
        if (this.player.isVoteless) {
          this.updatePlayer("isVoteless", false);
        }
      }
    },
    changeName() {
      if (this.session.isSpectator) return;
      const name = prompt(this.$t("prompt.playerName"), this.player.name) || this.player.name;
      this.updatePlayer("name", name, true);
    },
    removeReminder(reminder) {
      const reminders = [...this.player.reminders];
      reminders.splice(this.player.reminders.indexOf(reminder), 1);
      this.updatePlayer("reminders", reminders, true);
    },
    updatePlayer(property, value, closeMenu = false) {
      if (this.session.isSpectator && property !== "reminders") return;
      this.$store.commit("players/update", {
        player: this.player,
        property,
        value
      });
      if (closeMenu) {
        this.isMenuOpen = false;
      }
    },
    removePlayer() {
      this.isMenuOpen = false;
      this.$emit("trigger", ["removePlayer"]);
    },
    swapPlayer(player) {
      this.isMenuOpen = false;
      this.$emit("trigger", ["swapPlayer", player]);
    },
    movePlayer(player) {
      this.isMenuOpen = false;
      this.$emit("trigger", ["movePlayer", player]);
    },
    nominatePlayer(player) {
      this.isMenuOpen = false;
      this.$emit("trigger", ["nominatePlayer", player]);
    },
    cancel() {
      this.$emit("trigger", ["cancel"]);
    },
    claimSeat() {
      this.isMenuOpen = false;
      this.$emit("trigger", ["claimSeat"]);
    },
    /**
     * Allow the ST to override a locked vote.
     */
    vote() {
      if (this.session.isSpectator) return;
      if (!this.voteLocked) return;
      this.$store.commit("session/voteSync", [
        this.index,
        !this.session.votes[this.index]
      ]);
    }
  }
};
</script>

<style lang="scss">
@import "../vars.scss";
@import "../gstone-assets.scss";

.fold-enter-active,
.fold-leave-active {
  transition: transform 250ms ease-in-out;
  transform-origin: left center;
  transform: perspective(200px);
}
.fold-enter,
.fold-leave-to {
  transform: perspective(200px) rotateY(90deg);
}

/***** Player token *****/
.circle .player {
  margin-bottom: 10px;

  &:before {
    content: " ";
    display: block;
    padding-top: 100%;
  }

  .shroud {
    top: 0;
    left: 0;
    position: absolute;
    width: 100%;
    height: 45%;
    cursor: pointer;
    transform: rotateX(0deg);
    transform-origin: top center;
    transition: transform 200ms ease-in-out;
    z-index: 2;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8));

    &:before {
      content: " ";
      background: url($gstone-shroud) center -10px no-repeat;
      background-size: auto 110%;
      position: absolute;
      margin-left: -50%;
      width: 100%;
      height: 100%;
      left: 50%;
      top: -30%;
      opacity: 0;
      transform: perspective(400px) scale(1.5);
      transform-origin: top center;
      transition: all 200ms;
      pointer-events: none;
    }

    #townsquare.spectator & {
      pointer-events: none;
    }

    #townsquare:not(.spectator) &:hover:before {
      opacity: 0.5;
      top: -10px;
      transform: scale(1);
    }
  }

  &.dead .shroud:before {
    opacity: 1;
    top: 0;
    transform: perspective(400px) scale(1);
  }

  #townsquare:not(.spectator) &.dead .shroud:hover:before {
    opacity: 1;
  }
}

/****** Life token *******/
.player {
  z-index: 2;
  .life {
    border-radius: 50%;
    width: 100%;
    background: url($gstone-life) center center;
    background-size: 100%;
    @include token-chrome;
    cursor: pointer;
    transition: transform 200ms ease-in-out;
    transform: perspective(400px) rotateY(180deg);
    backface-visibility: hidden;
    position: absolute;
    left: 0;
    top: 0;

    &:before {
      content: " ";
      display: block;
      padding-top: 100%;
    }
  }

  &.dead {
    &.no-vote .life:after {
      display: none;
    }

    .life {
      background-image: url($gstone-death);

      &:after {
        content: " ";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: url("../assets/vote.png") center center no-repeat;
        background-size: 50%;
        height: 100%;
        pointer-events: none;
      }
    }
  }

  &.traveler .life {
    filter: grayscale(100%);
  }
}

#townsquare.hide-roles .player {
  .life {
    transform: perspective(400px) rotateY(0deg);
  }

  .shroud {
    transform: perspective(400px) rotateX(90deg);
    pointer-events: none;
  }

  &.traveler:not(.dead) .token {
    transform: perspective(400px) scale(0.8);
    pointer-events: none;
    transition-delay: 0s;
  }

  &.traveler.dead .token {
    transition-delay: 0s;
  }
}

/***** Role token ******/
.player .token {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  transition: transform 200ms ease-in-out;
  transform: perspective(400px) rotateY(0deg);
  backface-visibility: hidden;
}

#townsquare.hide-roles .circle .token {
  transform: perspective(400px) rotateY(-180deg);
}

/****** Player choice icons *******/
.player .overlay {
  width: 100%;
  position: absolute;
  pointer-events: none;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  &:after {
    content: " ";
    display: block;
    padding-top: 100%;
  }
}
.player .overlay svg {
  position: absolute;
  filter: drop-shadow(0 0 3px black);
  z-index: 2;
  cursor: pointer;
  &.swap,
  &.move,
  &.nominate,
  &.vote,
  &.cancel {
    width: 50%;
    height: 60%;
    opacity: 0;
    pointer-events: none;
    transition: all 250ms;
    transform: scale(0.2);
    * {
      stroke-width: 10px;
      stroke: white;
      fill: url(#default);
    }
    &:hover *,
    &.fa-hand-paper * {
      fill: url(#demon);
    }
    &.fa-times * {
      fill: url(#townsfolk);
    }
  }
}

// other player voted yes, but is not locked yet
#townsquare.vote .player.vote-yes .overlay svg.vote.fa-hand-paper {
  opacity: 0.5;
  transform: scale(1);
}

// you voted yes | a locked vote yes | a locked vote no
#townsquare.vote .player.you.vote-yes .overlay svg.vote.fa-hand-paper,
#townsquare.vote .player.vote-lock.vote-yes .overlay svg.vote.fa-hand-paper,
#townsquare.vote .player.vote-lock:not(.vote-yes) .overlay svg.vote.fa-times {
  opacity: 1;
  transform: scale(1);
}

// a locked vote can be clicked on by the ST
#townsquare.vote:not(.spectator) .player.vote-lock .overlay svg.vote {
  pointer-events: all;
}

li.from:not(.nominate) .player .overlay svg.cancel {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

li.swap:not(.from) .player .overlay svg.swap,
li.nominate .player .overlay svg.nominate,
li.move:not(.from) .player .overlay svg.move {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

/****** Vote icon ********/
.player .has-vote {
  color: #fff;
  filter: drop-shadow(0 0 3px black);
  transition: opacity 250ms;
  z-index: 2;

  #townsquare.hide-roles & {
    opacity: 0;
    pointer-events: none;
  }
}

.has-vote {
  position: absolute;
  margin-top: -15%;
  right: 2px;
}

/****** Session seat glow *****/
@mixin glow($name, $color) {
  @keyframes #{$name}-glow {
    0% {
      box-shadow: 0 0 rgba($color, 1);
      border-color: $color;
    }
    50% {
      border-color: black;
    }
    100% {
      box-shadow: 0 0 20px 16px transparent;
      border-color: $color;
    }
  }

  .player.you.#{$name} .token {
    animation: #{$name}-glow 5s ease-in-out infinite;
  }
}

@include glow("townsfolk", $townsfolk);
@include glow("outsider", $outsider);
@include glow("demon", $demon);
@include glow("minion", $minion);
@include glow("traveler", $traveler);

.player.you .token {
  animation: townsfolk-glow 5s ease-in-out infinite;
}

/****** Marked icon ******/
.player .marked {
  position: absolute;
  width: 100%;
  top: 0;
  filter: drop-shadow(0px 0px 6px black);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 250ms;
  opacity: 0;
  &:before {
    content: " ";
    padding-top: 100%;
    display: block;
  }
  svg {
    height: 60%;
    width: 60%;
    position: absolute;
    stroke: white;
    stroke-width: 15px;
    path {
      fill: white;
    }
  }
}
.player.marked .marked {
  opacity: 0.5;
}

/****** Seat icon ********/
.player .seat {
  position: absolute;
  left: 2px;
  margin-top: -15%;
  color: #fff;
  filter: drop-shadow(0 0 3px black);
  cursor: default;
  z-index: 2;
  &.highlight {
    animation-iteration-count: 1;
    animation: redToWhite 1s normal forwards;
  }
}

// highlight animation
@keyframes redToWhite {
  from {
    color: $demon;
  }
  to {
    color: white;
  }
}

.player.you .seat {
  color: $townsfolk;
}

/***** Player name *****/
.player > .name {
  right: 10%;
  display: flex;
  justify-content: center;
  font-size: 120%;
  line-height: 120%;
  cursor: pointer;
  white-space: nowrap;
  width: 120%;
  @include nameplate-chrome;
  top: 5px;
  padding: 0 4px;

  svg {
    top: 3px;
    margin-right: 2px;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    flex-grow: 1;
  }

  #townsquare:not(.spectator) &:hover,
  &.active {
    color: red;
  }

}

.player.dead > .name {
  opacity: 0.5;
}

/***** Player menu *****/
.player > .menu {
  position: absolute;
  left: 110%;
  bottom: -5px;
  text-align: left;
  white-space: nowrap;
  max-width: min(220px, calc(100vw - 32px));
  @include panel-chrome;
  padding: 2px 5px;
  margin-left: 15px;
  cursor: pointer;

  li {
    min-height: 36px;
    display: flex;
    align-items: center;
  }

  &:before {
    content: " ";
    width: 0;
    height: 0;
    position: absolute;
    border: 10px solid transparent;
    border-right-color: $chrome-border;
    right: 100%;
    bottom: 5px;
    margin-right: 2px;
  }

  li:hover {
    color: red;
  }

  li.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    &:hover {
      color: white;
    }
  }

  svg {
    margin-right: 2px;
  }
}

/***** Ability text *****/
#townsquare.hide-roles .circle .ability {
  display: none;
}
.circle .player .shroud:hover ~ .token .ability,
.circle .player .token:hover .ability {
  opacity: 1;
}

/**** Night reminders ****/
.player .night-order {
  z-index: 3;
}

.player.dead .night-order em {
  color: #ddd;
  background: linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, gray 100%);
}

/***** Reminder token *****/
.circle .reminder {
  background: url("../assets/reminder.png") center center;
  background-size: 100%;
  width: 50%;
  height: 0;
  padding-bottom: 50%;
  box-sizing: content-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px 0 0 -25%;
  border-radius: 50%;
  @include token-chrome;
  transition: all 200ms;
  cursor: pointer;

  .text {
    line-height: 90%;
    color: black;
    font-size: 50%;
    font-weight: bold;
    text-align: center;
    margin-top: 50%;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 15%;
    text-shadow: 0 1px 1px #f6dfbd, 0 -1px 1px #f6dfbd, 1px 0 1px #f6dfbd,
      -1px 0 1px #f6dfbd;
  }

  .icon,
  &:after {
    content: " ";
    position: absolute;
    top: 0;
    width: 90%;
    height: 90%;
    background-size: 100%;
    background-position: center 0;
    background-repeat: no-repeat;
    background-image: url("../assets/icons/plus.png");
    transition: opacity 200ms;
  }

  &:after {
    background-image: url("../assets/icons/x.png");
    opacity: 0;
    top: 5%;
  }

  &.add {
    opacity: 0;
    top: 30px;
    &:after {
      display: none;
    }
    .icon {
      top: 5%;
    }
  }

  &.custom {
    .icon {
      display: none;
    }
    .text {
      font-size: 70%;
      word-break: break-word;
      margin-top: 0;
      display: flex;
      align-items: center;
      align-content: center;
      justify-content: center;
      border-radius: 50%;
      top: 0;
    }
  }

  &:hover:before {
    opacity: 0;
  }
  &:hover:after {
    opacity: 1;
  }
}

.circle .reminderHoverTarget {
  opacity: 0;
  width: calc(50% + 8px);
  padding-top: calc(50% + 38px);
  margin-top: calc(-25% - 33px);
  margin-left: calc(-25% - 1px);
  border-radius: 0 0 999px 999px;
  pointer-events: auto;
  transform: none !important;
  z-index: -1;
}

.circle li:hover .reminder.add {
  opacity: 1;
  top: 0;
}
.circle li:hover .reminder.add:before {
  opacity: 1;
}

#townsquare.hide-roles .reminder {
  opacity: 0;
  pointer-events: none;
}

.circle li.seat-pending > .player {
  box-shadow: 0 0 0 3px rgba(255, 140, 60, 0.85),
    0 0 12px rgba(255, 100, 0, 0.45);
  border-radius: 50%;
}

.circle li.seat-preview > .player {
  box-shadow: 0 0 0 2px rgba(120, 200, 255, 0.75),
    0 0 10px rgba(70, 213, 255, 0.35);
  border-radius: 50%;
}

.circle .player.battle-log-pending .token {
  filter: drop-shadow(0 0 6px rgba(255, 140, 60, 0.8));
}

.circle .pending-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 5;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(200, 80, 0, 0.95);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  line-height: 18px;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
}

.circle .shroud.preview-ghost:before {
  opacity: 0.45 !important;
  animation: battleLogPulse 1.2s ease-in-out infinite;
}

.circle .reminder.preview-ghost-reminder {
  opacity: 0.45;
  pointer-events: none;
  animation: battleLogPulse 1.2s ease-in-out infinite;
}

@keyframes battleLogPulse {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.65;
  }
}
</style>
