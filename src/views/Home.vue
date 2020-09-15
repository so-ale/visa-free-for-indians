<template>
  <div class="home">
    <div class="map-container">
      <WorldMapVue
        :countryColors="true"
        :countryData="countries"
        :show-overlay="showMapOverlay"
        @mouseenter="hoverStart"
        @mouseleave="hoverEnd"
        @click="selectCountry"
      >
        <template v-slot:overlay>
          <a href="www.wikipedia.org/country"> Take me there </a>
        </template>
      </WorldMapVue>
    </div>
    <div class="filters"></div>
    <div class="search"></div>
    <ul class="country-table">
      <li v-for="key in Object.keys(sheetRows)" :key="key">
        <span>{{ sheetRows[key].continent }}</span>
        <span>{{ sheetRows[key].region }}</span>
        <span>{{ sheetRows[key].visa_req }}</span>
        <span>{{ sheetRows[key].allowed_stay }}</span>
        <span>{{ sheetRows[key].notes }}</span>
        <span>{{ sheetRows[key].wikipedia }}</span>
        <span>{{ sheetRows[key].wikivoyage }}</span>
      </li>
    </ul>
    <modal name="countryinfo">
      <h2>Country {{ clickedCountry }} has been selected</h2>
    </modal>
  </div>
</template>

<script>
// @ is an alias to /src
import WorldMapVue from "world-map-vue";
import Vue from "vue";
import { WP } from "@/services/gsheets";

export default {
  name: "Home",
  components: {
    WorldMapVue
  },

  data() {
    return {
      hoverSavedColor: "",
      showMapOverlay: false,
      clickedCountry: "",
      countries: {
        US: "#2200AA"
      },
      rawSheetRows: []
    };
  },

  computed: {
    sheetRows() {
      let ret = {};
      for (const row of this.rawSheetRows) {
        const country = row.Country;
        const rowData = {
          region: row.Region,
          continent: row.Continent,
          visa_req: row["Visa requirement"],
          allowed_stay: row["Allowed stay"],
          notes: row.Notes,
          wikipedia: row.Wikipedia,
          wikivoyage: row.WikiVoyage
        };

        ret[country] = rowData;
      }

      return ret;
    }
  },

  async mounted() {
    WP.init();
    this.rawSheetRows = await WP.getSheetRows();
  },

  methods: {
    hoverStart(code) {
      this.hoverSavedColor = this.countries[code];
      // Vue.set(this.countries, code, "yellow");

      // Update your data/property to be displayed on the overlay.
    },

    hoverEnd() {},

    selectCountry(code) {
      Vue.set(this.countries, code, "green");
      this.clickedCountry = code;
      this.$modal.show("countryinfo");
      console.log(document.getElementById(code).getAttribute("title"));
    }
  }
};
</script>

<style lang="scss" scoped>
.home {
  height: 100vh;

  .map-container {
    height: 70%;
  }
}
</style>

<style lang="scss">
.world-map-vue .land {
  &:hover {
    fill: orange !important;
  }
}
</style>
