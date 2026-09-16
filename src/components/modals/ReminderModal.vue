<template>
  <Modal
    v-if="modals.reminder && availableReminders.length && players[playerIndex]"
    @close="toggleModal('reminder')"
  >
    <h3>{{ $t("reminder.choose") }}</h3>
    <ul class="reminders">
      <li
        v-for="reminder in availableReminders"
        class="reminder"
        :class="[reminder.role]"
        :key="reminder.role + ' ' + reminder.name"
        @click="addReminder(reminder)"
      >
        <span
          class="icon"
          :style="{
            backgroundImage: `url(${
              reminder.image && grimoire.isImageOptIn
                ? reminder.image
                : require('../../assets/icons/' +
                    (reminder.imageAlt || reminder.role) +
                    '.png')
            })`
          }"
        ></span>
        <span class="text">{{ reminder.name }}</span>
      </li>
    </ul>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";

/**
 * Helper function that maps a reminder name with a role-based object that provides necessary visual data.
 * @param role The role for which the reminder should be generated
 * @return {function(*): {image: string|string[]|string|*, role: *, name: *, imageAlt: string|*}}
 */
const mapReminder = ({ id, image, imageAlt }) => name => ({
  role: id,
  image,
  imageAlt,
  name
});

export default {
  components: { Modal },
  props: ["playerIndex"],
  computed: {
    availableReminders() {
      let reminders = [];
      const { players, bluffs } = this.$store.state.players;
      this.$store.state.roles.forEach(role => {
        // add reminders from player roles
        if (players.some(p => p.role.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
        // add reminders from bluff/other roles
        else if (bluffs.some(bluff => bluff.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
        // add global reminders
        if (role.remindersGlobal && role.remindersGlobal.length) {
          reminders = [
            ...reminders,
            ...role.remindersGlobal.map(mapReminder(role))
          ];
        }
      });
      // add fabled reminders
      this.$store.state.players.fabled.forEach(role => {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
      });

      // add out of script traveler reminders
      this.$store.state.otherTravelers.forEach(role => {
        if (players.some(p => p.role.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
      });

      reminders.push({ role: "good", name: this.$t("reminder.good") });
      reminders.push({ role: "evil", name: this.$t("reminder.evil") });
      reminders.push({ role: "custom", name: this.$t("reminder.customNote") });
      return reminders;
    },
    ...mapState(["modals", "grimoire"]),
    ...mapState("players", ["players"])
  },
  methods: {
    addReminder(reminder) {
      const player = this.$store.state.players.players[this.playerIndex];
      if (reminder.role === "custom") {
        this.$store
          .dispatch("dialog/prompt", {
            message: this.$t("prompt.customReminder"),
          })
          .then(name => {
            if (!name) return;
            this.$store.commit("players/update", {
              player,
              property: "reminders",
              value: [...player.reminders, { role: "custom", name }],
            });
            this.$store.commit("toggleModal", "reminder");
          });
        return;
      }
      this.$store.commit("players/update", {
        player,
        property: "reminders",
        value: [...player.reminders, reminder],
      });
      this.$store.commit("toggleModal", "reminder");
    },
    ...mapMutations(["toggleModal"])
  }
};
</script>

<style scoped lang="scss">
@import "../../vars.scss";
@import "../../gstone-assets.scss";

ul.reminders .reminder {
  background: url($gstone-reminder) center center;
  background-size: 100%;
  width: 14vh;
  height: 14vh;
  max-width: 100px;
  max-height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1%;
  border-radius: 50%;
  border: 1px solid rgba($grimoire-brass, 0.42);
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.44),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3);
  @include reminder-role-face;
  cursor: pointer;
  line-height: 100%;
  transition: all 200ms;

  &:hover {
    transform: scale(1.05);
    border-color: rgba($grimoire-blood-bright, 0.78);
  }
}
</style>
