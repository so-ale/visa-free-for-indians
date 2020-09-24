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
        <superselect
          v-model="continentFilter"
          id="continentFilter"
          :options="continents"
        />
      </div>
      <div class="region-filters">
        <label for="regionFilter">
          REGION:
        </label>
        <superselect
          v-model="regionFilter"
          id="regionFilter"
          :options="regions"
        />
      </div>
    </div>
    <div class="search">
      <input type="text" placeholder="Search" v-model="searchKey" />
    </div>
    <table v-if="searchFilteredRowKeys" class="country-table" CELLSPACING="0">
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
        <tr
          v-for="key in searchFilteredRowKeys"
          :key="key"
          :class="visaClasses[sheetRows[key].visa_req]"
        >
          <td>{{ key }}</td>
          <td>{{ sheetRows[key].continent }}</td>
          <td>{{ sheetRows[key].region }}</td>
          <td>{{ sheetRows[key].visa_req }}</td>
          <td>{{ sheetRows[key].allowed_stay }}</td>
          <td>{{ sheetRows[key].notes }}</td>
          <td>
            <a :href="sheetRows[key].wikipedia"
              ><img
                src="https://upload.wikimedia.org/wikipedia/commons/4/46/Wikipedia-W-visual-balanced.svg"
            /></a>
          </td>
          <td>
            <a :href="sheetRows[key].wikivoyage"
              ><img
                src="https://upload.wikimedia.org/wikipedia/commons/4/47/Notification-icon-Wikivoyage-logo.svg"
            /></a>
          </td>
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
import { GS } from "@/services/gsheets";

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
        IN: "orange"
      },
      rawSheetRows: [],
      searchKey: "",
      continentFilter: "",
      regionFilter: "",
      visaClasses: {
        "Visa Not Required": "notreq",
        "eVisa/ETA": "evisa",
        "Visa On Arrival": "arrival",
        "Visa Required": "required",
        "Freedom Of Movement": "freedom"
      }
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
      this.regionFilter = "";
    },

    regionFilter() {
      this.searchKey = "";
    }
  },

  async mounted() {
    GS.init();
    this.rawSheetRows = await GS.getSheetRows();

    this.setCountryColors();
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
    },

    setCountryColors() {
      const landElArray = document.querySelectorAll(".land");

      for (const land of landElArray) {
        const countryCode = land.getAttribute("id");
        const countryName = land.getAttribute("title");
        const countryRow = this.sheetRows[countryName];

        if (countryRow) {
          Vue.set(
            this.countries,
            countryCode,
            this.visaBgColors[countryRow.visa_req]
          );
        } else {
          console.log("Missing country:", countryCode, countryName);
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.home {
  background: #00a99d;

  .map-container {
    height: 90vh;
    background: #0f7774;
    padding: 40px 0;
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

  .country-table {
    width: 80%;
    margin: 0 auto;
    color: white;

    tr {
      &.notreq {
        background: #22b14c;
        color: #efefef;
      }

      &.evisa {
        background: #80ccdd;
        color: #666666;
      }

      &.arrival {
        background: #aacc19;
        color: #666666;
      }

      &.required {
        background: #999999;
        color: #efefef;
      }

      &.freedom {
        background: #ff8c00;
        color: #666666;
      }
    }

    td:first-of-type,
    td:last-of-type {
      font-weight: bold;
      padding: 10px 20px;
    }

    tr:nth-child(odd) {
      td {
        background: rgba(#000000, 0.05);
      }
    }

    td {
      padding: 10px 0;

      a > img {
        width: auto;
        height: 22px;
        background: white;
        padding: 4px;
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

  stroke-width: 0.5;
}
</style>
