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
    <div class="filters">
      <div class="continent-filters">
        <span
          v-for="continent in continents"
          :key="continent"
          :class="{ active: continentFilter === continent }"
          @click="continentFilter = continent"
        >
          {{ continent }}
        </span>
      </div>
      <div class="region-filters">
        <span
          v-for="region in regions"
          :key="region"
          :class="{ active: regionFilter === region }"
          @click="regionFilter = region"
        >
          {{ region }}
        </span>
      </div>
    </div>
    <div class="search">
      <input type="text" placeholder="Search" v-model="searchKey" />
    </div>
    <table class="country-table">
      <thead>
        <th>Country</th>
        <th>Continent</th>
        <th>Region</th>
        <th>Visa requirement</th>
        <th>Allowed stay</th>
        <th>Notes</th>
        <th>Wikipedia</th>
        <th>WikiVoyage</th>
      </thead>
      <tbody>
        <tr v-for="key in searchFilteredRowKeys" :key="key">
          <td>{{ key }}</td>
          <td>{{ sheetRows[key].continent }}</td>
          <td>{{ sheetRows[key].region }}</td>
          <td>{{ sheetRows[key].visa_req }}</td>
          <td>{{ sheetRows[key].allowed_stay }}</td>
          <td>{{ sheetRows[key].notes }}</td>
          <td>{{ sheetRows[key].wikipedia }}</td>
          <td>{{ sheetRows[key].wikivoyage }}</td>
        </tr>
      </tbody>
    </table>
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
      rawSheetRows: [],
      searchKey: "",
      continentFilter: "",
      regionFilter: ""
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
    },

    filteredRowKeys() {
      let res = Object.keys(this.sheetRows);
      if (this.continentFilter) {
        res = res.filter(
          el =>
            this.sheetRows[el].continent.toLowerCase() ===
            this.continentFilter.toLowerCase()
        );
      }

      if (this.regionFilter) {
        res = res.filter(
          el =>
            this.sheetRows[el].region.toLowerCase() ===
            this.regionFilter.toLowerCase()
        );
      }

      return res;
    },

    searchFilteredRowKeys() {
      if (!this.searchKey) {
        return this.filteredRowKeys;
      } else {
        return this.filteredRowKeys.filter(
          el =>
            JSON.stringify(this.sheetRows[el])
              .toLowerCase()
              .includes(this.searchKey.toLowerCase()) ||
            el.toLowerCase().includes(this.searchKey.toLowerCase())
        );
      }
    },

    regions() {
      let res = [];
      for (const key of Object.keys(this.sheetRows)) {
        if (!res.includes(this.sheetRows[key].region)) {
          if (
            !this.continentFilter ||
            this.sheetRows[key].region
              .toLowerCase()
              .includes(this.continentFilter.toLowerCase())
          ) {
            res.push(this.sheetRows[key].region);
          }
        }
      }

      return res;
    },

    continents() {
      let res = [];
      for (const key of Object.keys(this.sheetRows)) {
        if (!res.includes(this.sheetRows[key].continent)) {
          res.push(this.sheetRows[key].continent);
        }
      }

      return res;
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

  .filters {
    .continent-filters {
      span {
        &.active {
          color: lightblue;
        }
      }
    }

    .region-filters {
      span {
        &.active {
          color: lightblue;
        }
      }
    }
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
