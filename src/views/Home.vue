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
        <label for="continentFilter">
          CONTINENT:
        </label>
        <select v-model="continentFilter" id="continentFilter">
          <option
            v-for="continent in continents"
            :key="continent"
            :class="{ active: continentFilter === continent }"
            :value="continent"
          >
            {{ continent }}
          </option>
        </select>
      </div>
      <div class="region-filters">
        <label for="regionFilter">
          REGION:
        </label>
        <select v-model="regionFilter" id="regionFilter">
          <option
            v-for="region in regions"
            :key="region"
            :class="{ active: regionFilter === region }"
            @change="regionFilter = region"
          >
            {{ region }}
          </option>
        </select>
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
      continentFilter: "Africa",
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
      // Setup an empty array to which we will add the unique regions
      let res = [];

      // Loop through the keys Array of the sheetRows object
      for (const key of Object.keys(this.sheetRows)) {
        // Does the result array already include this region? If not, process it
        if (!res.includes(this.sheetRows[key].region)) {
          // Do we have multiple continents for this region? e.g. Eurasia <= Europe, Asia
          if (this.continentFilter && this.sheetRows[key].multipleContinents) {
            // Yes, extract the multiple continents from the semicolon separated string, as an array
            const multipleContinents = this.sheetRows[
              key
            ].multipleContinents.split(";");

            // Loop thru the extracted continent array
            for (const cont of multipleContinents) {
              // Check if the looped continent is what is set in our continent filter
              if (this.continentFilter === cont) {
                // Yes, push the region to our array since it is from a continent which is set as filter
                res.push(this.sheetRows[key].region);
              }
            }
          } else if (
            !this.continentFilter ||
            this.sheetRows[key].continent === this.continentFilter
          ) {
            // This region belongs to just 1 continent, and either there is no filter,
            // ...or the filter is set to that 1 continent
            res.push(this.sheetRows[key].region);
          }
        }
      }

      return res;
    },

    continents() {
      // Setup an empty array to which we will add the unique continents
      let res = [];

      // Go through the array of keys of the object [sheetrows]
      for (const key of Object.keys(this.sheetRows)) {
        // For each key, get the sheetrows[key] continent
        // If my result does not already have the continent, then add it
        if (!res.includes(this.sheetRows[key].continent)) {
          res.push(this.sheetRows[key].continent);
        }
      }

      return res;
    }
  },

  watch: {
    continentFilter() {
      this.searchKey = "";
    },

    regionFilter() {
      this.searchKey = "";
    }
  },

  async mounted() {
    WP.init();
    this.rawSheetRows = await WP.getSheetRows();
  },

  methods: {
    hoverStart(code) {
      this.hoverSavedColor = this.countries[code];
      this.showMapOverlay = true;
      // Vue.set(this.countries, code, "yellow");

      // Update your data/property to be displayed on the overlay.
    },

    hoverEnd() {
      this.showMapOverlay = false;
    },

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
        cursor: pointer;
        &.active {
          color: lightblue;
        }
      }
    }

    .region-filters {
      span {
        cursor: pointer;
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
