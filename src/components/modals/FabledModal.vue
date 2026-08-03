<template>
  <Modal v-if="modals.fabled && available.length" @close="toggleModal('fabled')">
    <h3>
      {{ $t("fabled.choose") }}
    </h3>
    <template v-if="availableFabled.length">
      <h4>{{ $t("team.fabled") }}</h4>
      <ul class="tokens">
        <li
          v-for="role in availableFabled"
          :key="role.id"
          @click="setFabled(role)"
        >
          <Token :role="role" />
        </li>
      </ul>
    </template>
    <template v-if="availableLoric.length">
      <h4>{{ $t("team.loric") }}</h4>
      <ul class="tokens">
        <li
          v-for="role in availableLoric"
          :key="role.id"
          @click="setFabled(role)"
        >
          <Token :role="role" />
        </li>
      </ul>
    </template>
  </Modal>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal";
import Token from "../Token";

export default {
  components: { Token, Modal },
  computed: {
    ...mapState(["modals", "grimoire"]),
    available() {
      const list = [];
      this.$store.state.fabled.forEach(role => {
        if (
          !this.$store.state.players.fabled.some(fable => fable.id === role.id)
        ) {
          list.push(role);
        }
      });
      return list;
    },
    availableFabled() {
      return this.available.filter(r => r.team !== "loric");
    },
    availableLoric() {
      return this.available.filter(r => r.team === "loric");
    }
  },
  methods: {
    setFabled(role) {
      this.$store.commit("players/setFabled", {
        fabled: role
      });
      this.$store.commit("toggleModal", "fabled");
    },
    ...mapMutations(["toggleModal"])
  }
};
</script>

<style scoped lang="scss">
@import "../../vars.scss";

h4 {
  margin: 0.75rem 0 0.25rem;
  font-size: 1rem;
  color: $fabled;
  &:nth-of-type(2) {
    color: $loric;
  }
}

ul.tokens li {
  border-radius: 50%;
  width: 8vw;
  margin: 0.5%;
  transition: transform 500ms ease;

  &:hover {
    transform: scale(1.2);
    z-index: 10;
  }
}
</style>
