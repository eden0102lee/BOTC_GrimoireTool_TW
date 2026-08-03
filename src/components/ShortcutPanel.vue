<template>

  <div class="shortcut-panel" :class="{ collapsed: !expanded }">

    <button

      v-if="!expanded"

      type="button"

      class="toggle-tab"

      :title="$t('shortcuts.show')"

      @click="setExpanded(true)"

    >

      {{ $t("shortcuts.title") }}

    </button>

    <div v-else class="panel">

      <header class="panel-header">

        <span class="panel-title">{{ $t("shortcuts.title") }}</span>

        <button

          type="button"

          class="collapse-btn"

          :title="$t('shortcuts.hide')"

          @click="setExpanded(false)"

        >

          <font-awesome-icon icon="times" />

        </button>

      </header>

      <p class="section-label">{{ $t("shortcuts.gstone") }}</p>

      <ul class="shortcut-list">

        <li v-for="item in gstoneShortcuts" :key="item.keys">

          <span class="keys">{{ item.keys }}</span>

          <span class="desc">{{ $t(item.label) }}</span>

        </li>

      </ul>

      <p class="section-label">{{ $t("shortcuts.extras") }}</p>

      <ul class="shortcut-list">

        <li v-for="item in extraShortcuts" :key="item.keys">

          <span class="keys">{{ item.keys }}</span>

          <span class="desc">{{ $t(item.label) }}</span>

        </li>

      </ul>

    </div>

  </div>

</template>



<script>

const STORAGE_KEY = "shortcutPanelExpanded";



export default {

  data() {

    return {

      expanded: localStorage.getItem(STORAGE_KEY) !== "0",

      gstoneShortcuts: [

        { keys: "A", label: "shortcuts.addPlayer" },

        { keys: "C", label: "shortcuts.createTown" },

        { keys: "J", label: "shortcuts.joinTown" },

        { keys: "Q", label: "shortcuts.enterDay" },

        { keys: "R", label: "shortcuts.reference" },

        { keys: "N", label: "shortcuts.nightOrder" },

      ],

      extraShortcuts: [

        { keys: "H", label: "shortcuts.hideRoles" },

        { keys: "S", label: "shortcuts.previousPhase" },

        { keys: "E", label: "shortcuts.edition" },

        { keys: "B", label: "shortcuts.battleLog" },

        { keys: "V", label: "shortcuts.voteHistory" },

        { keys: "F", label: "shortcuts.fabled" },

        { keys: "I", label: "shortcuts.sendCharacters" },

        { keys: "Esc", label: "shortcuts.closeModal" },

      ],

    };

  },

  methods: {

    setExpanded(value) {

      this.expanded = value;

      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");

    },

  },

};

</script>



<style scoped lang="scss">

.shortcut-panel {

  .toggle-tab,

  .panel {

    pointer-events: auto;

  }

}



.toggle-tab {

  padding: 4px 10px;

  border: 2px solid black;

  border-radius: 8px;

  background: rgba(0, 0, 0, 0.55);

  color: white;

  font-family: inherit;

  font-size: inherit;

  cursor: pointer;

  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);

  transition: color 200ms;



  &:hover {

    color: #ff6b6b;

  }

}



.panel {

  min-width: 200px;

  max-width: 260px;

  background: rgba(0, 0, 0, 0.6);

  border: 2px solid black;

  border-radius: 10px;

  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);

  backdrop-filter: blur(2px);

}



.panel-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 6px 8px 4px;

  border-bottom: 1px solid rgba(255, 255, 255, 0.15);

}



.panel-title {

  font-family: PiratesBay, sans-serif;

  letter-spacing: 1px;

}



.collapse-btn {

  padding: 0 4px;

  border: none;

  background: transparent;

  color: white;

  cursor: pointer;

  opacity: 0.7;

  line-height: 1;



  &:hover {

    opacity: 1;

    color: #ff6b6b;

  }

}



.section-label {

  margin: 6px 8px 2px;

  font-size: 70%;

  opacity: 0.65;

  letter-spacing: 0.5px;

}



.shortcut-list {

  margin: 0;

  padding: 2px 8px 6px;

  list-style: none;



  li {

    display: flex;

    align-items: baseline;

    gap: 8px;

    padding: 2px 0;

  }

}



.keys {

  flex-shrink: 0;

  min-width: 3.2em;

  font-weight: bold;

  font-family: "Roboto Condensed", monospace;

  color: #46d5ff;

  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);

}



.desc {

  opacity: 0.9;

}

</style>

