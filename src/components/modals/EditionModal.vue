<template>
  <Modal class="editions" v-if="modals.edition" @close="toggleModal('edition')">
    <div v-if="!isCustom">
      <h3>{{ $t("edition.select") }}</h3>
      <ul class="editions">
        <li
          v-for="edition in selectableEditions"
          class="edition"
          :class="['edition-' + edition.id]"
          :style="{
            backgroundImage: `url(${editionLogoUrl(edition)})`
          }"
          :key="edition.id"
          @click="pickEdition(edition)"
        >
          {{ $editionName(edition) }}
        </li>
      </ul>
      <div class="custom-entry">
        <button type="button" class="custom-btn" @click="isCustom = true">
          <font-awesome-icon icon="file-upload" />
          {{ $t("edition.custom") }}
        </button>
      </div>
    </div>
    <div class="custom" v-else>
      <h3>{{ $t("edition.loadCustom") }}</h3>
      {{ $t("edition.customHelp") }}
      <a href="https://script.bloodontheclocktower.com/" target="_blank">{{
        $t("edition.officialScriptTool")
      }}</a>
      或
      <a href="https://clocktower.gstonegames.com/script_tool/" target="_blank">{{
        $t("edition.scriptTool")
      }}</a>
      。<br />
      <br />
      {{ $t("edition.customCharsHelp") }}
      <h3>{{ $t("edition.popularScripts") }}</h3>
      <ul class="scripts">
        <li
          v-for="(script, index) in scripts"
          :key="index"
          @click="handleURL(script[1])"
        >
          {{ script[0] }}
        </li>
      </ul>
      <input
        type="file"
        ref="upload"
        accept="application/json"
        @change="handleUpload"
      />
      <div class="button-group">
        <div class="button" @click="openUpload">
          <font-awesome-icon icon="file-upload" /> {{ $t("edition.uploadJson") }}
        </div>
        <div class="button" @click="promptURL">
          <font-awesome-icon icon="link" /> {{ $t("edition.enterUrl") }}
        </div>
        <div class="button" @click="readFromClipboard">
          <font-awesome-icon icon="clipboard" /> {{ $t("edition.fromClipboard") }}
        </div>
        <div class="button" @click="isCustom = false">
          <font-awesome-icon icon="undo" /> {{ $t("edition.back") }}
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import editionJSON from "../../editions";
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal";
import { editionLogoUrl } from "../../edition-logos";

/** Temporarily show only base editions with Wiki English logos. */
const SELECTABLE_EDITION_IDS = ["tb", "bmr", "snv"];

export default {
  components: {
    Modal
  },
  data: function() {
    return {
      editions: editionJSON,
      isCustom: false,
      editionLogoUrl,
      scripts: [
        [
          "Deadly Penance Day",
          "https://gist.githubusercontent.com/bra1n/0337cc44c6fd2c44f7589256ed5486d2/raw/16be38fa3c01aaf49827303ac80577bdb52c0b25/penanceday.json"
        ],
        [
          "Catfishing 11.1",
          "https://gist.githubusercontent.com/bra1n/8a5ec41a7bbf945f6b7dfc1cef72b569/raw/a312ab93c2f302e0ef83c8b65a4e8e82760fda3a/catfishing.json"
        ],
        [
          "On Thin Ice (Teensyville)",
          "https://gist.githubusercontent.com/bra1n/8dacd9f2abc6f428331ea1213ab153f5/raw/0cacbcaf8ed9bddae0cca25a9ada97e9958d868b/on-thin-ice.json"
        ],
        [
          "Race To The Bottom (Teensyville)",
          "https://gist.githubusercontent.com/bra1n/63e1354cb3dc9d4032bcd0623dc48888/raw/5acb0eedcc0a67a64a99c7e0e6271de0b7b2e1b2/race-to-the-bottom.json"
        ],
        [
          "Frankenstein's Mayor by Ted (Teensyville)",
          "https://gist.githubusercontent.com/bra1n/32c52b422cc01b934a4291eeb81dbcee/raw/5bf770693bbf7aff5e86601c82ca4af3222f4ba6/Frankensteins_Mayor_by_Ted.json"
        ],
        [
          "Vigormortis High School (Teensyville)",
          "https://gist.githubusercontent.com/bra1n/1f65bd4a999524719d5dabe98c3c2d27/raw/22bbec6bf56a51a7459e5ae41ed47e41971c5445/VigormortisHighSchool.json"
        ]
      ]
    };
  },
  computed: {
    ...mapState(["modals"]),
    selectableEditions() {
      return this.editions.filter((edition) =>
        SELECTABLE_EDITION_IDS.includes(edition.id)
      );
    }
  },
  methods: {
    pickEdition(edition) {
      this.setEdition(edition);
    },
    openUpload() {
      this.$refs.upload.click();
    },
    handleUpload() {
      const file = this.$refs.upload.files[0];
      if (file && file.size) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          try {
            const roles = JSON.parse(reader.result);
            this.parseRoles(roles);
          } catch (e) {
            this.$store.dispatch("dialog/alert", {
              message: this.$t("edition.loadError", { error: e.message }),
            });
          }
          this.$refs.upload.value = "";
        });
        reader.readAsText(file);
      }
    },
    promptURL() {
      this.$store
        .dispatch("dialog/prompt", {
          message: this.$t("prompt.customScriptUrl"),
        })
        .then(url => {
          if (url) this.handleURL(url);
        });
    },
    async handleURL(url) {
      const res = await fetch(url);
      if (res && res.json) {
        try {
          const script = await res.json();
          this.parseRoles(script);
        } catch (e) {
          this.$store.dispatch("dialog/alert", {
            message: this.$t("edition.loadError", { error: e.message }),
          });
        }
      }
    },
    async readFromClipboard() {
      const text = await navigator.clipboard.readText();
      try {
        const roles = JSON.parse(text);
        this.parseRoles(roles);
      } catch (e) {
        this.$store.dispatch("dialog/alert", {
          message: this.$t("edition.loadError", { error: e.message }),
        });
      }
    },
    parseRoles(roles) {
      if (!roles || !roles.length) return;
      roles = roles.map(role => typeof role === "string" ? { id: role } : role);
      const metaIndex = roles.findIndex(({ id }) => id === "_meta");
      let meta = {};
      if (metaIndex > -1) {
        meta = roles.splice(metaIndex, 1).pop();
      }
      this.$store.commit("setCustomRoles", roles);
      this.$store.commit(
        "setEdition",
        Object.assign({}, meta, { id: "custom" })
      );
      // check for fabled and set those too, if present
      if (roles.some((role) => this.$store.state.fabled.has(role.id || role))) {
        const fabled = [];
        roles.forEach((role) => {
          if (this.$store.state.fabled.has(role.id || role)) {
            fabled.push(this.$store.state.fabled.get(role.id || role));
          }
        });
        this.$store.commit("players/setFabled", { fabled });
      }
      this.isCustom = false;
    },
    ...mapMutations(["toggleModal", "setEdition"])
  }
};
</script>

<style scoped lang="scss">
ul.editions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: clamp(4px, 1.5vw, 12px);
}

ul.editions .edition {
  font-family: PiratesBay, sans-serif;
  letter-spacing: 1px;
  text-align: center;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-sizing: border-box;
  aspect-ratio: 1 / 1;
  padding: clamp(4px, 1.2vw, 10px) clamp(4px, 1vw, 8px)
    clamp(6px, 1.5vw, 12px);
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  // Fluid tile: shrink on phones, cap on desktop
  width: clamp(88px, 28vw, 200px);
  max-width: calc(33.33% - 8px);
  margin: 0;
  font-size: clamp(0.75rem, 2.8vw, 1.1rem);
  line-height: 1.2;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
    1px 1px 0 #000, 0 0 5px rgba(0, 0, 0, 0.75);
  cursor: pointer;
  &:hover {
    color: red;
  }
}

.custom-entry {
  display: flex;
  justify-content: center;
  margin: clamp(8px, 2vw, 14px) 8px 4px;
}

.custom-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 18px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-family: inherit;
  font-size: clamp(0.9rem, 3.2vw, 1rem);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.45);

  &:hover {
    color: #ff6b6b;
    border-color: rgba(255, 107, 107, 0.8);
  }
}

@media screen and (max-width: 767.98px) {
  ul.editions .edition {
    width: clamp(96px, 40vw, 160px);
    max-width: calc(50% - 6px);
  }
  .custom-btn {
    width: 100%;
    max-width: min(320px, 92vw);
  }
}

@media screen and (max-width: 380px) {
  ul.editions .edition {
    width: clamp(80px, 42vw, 140px);
    font-size: 0.8rem;
  }
}

.custom {
  text-align: center;
  input[type="file"] {
    display: none;
  }
  .scripts {
    list-style-type: disc;
    font-size: 120%;
    cursor: pointer;
    display: block;
    width: 50%;
    text-align: left;
    margin: 10px auto;
    li:hover {
      color: red;
    }
  }
}
</style>
