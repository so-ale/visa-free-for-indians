<template>
  <div class="home">
    <div class="map-container">
      <WorldMapVue
        :countryColors="colors"
        :countryData="countries"
        :show-overlay="showMapOverlay"
        @mouseenter="onMouseEnterMapCountry"
        @mouseleave="onMouseLeaveMapCountry"
        @click="onClickMapCountry"
      >
        <template v-slot:overlay>
          <a href="www.wikipedia.org/country"> Take me there </a>
        </template>
      </WorldMapVue>
    </div>
    <modal name="countryinfo">
      <h2>Country {{ activeCountry }} has been selected</h2>
    </modal>
  </div>
</template>

<script>
// @ is an alias to /src
import WorldMapVue from "world-map-vue";
import Vue from "vue";

export default {
  name: "Home",
  components: {
    WorldMapVue
  },

  data() {
    return {
      savedColor: "",
      colors: true,
      showMapOverlay: false,
      activeCountry: "",
      countries: {
        US: "#2200AA",
        CA: "red",
        UK: "rgba(200, 200, 255, 0.1)"
      }
    };
  },

  methods: {
    hoverStart(code) {
      this.savedColor = this.countries[code];
      // Vue.set(this.countries, code, "yellow");

      // Update your data/property to be displayed on the overlay.
    },

    // hoverEnd(code) {
    // Vue.set(this.countries, code, this.savedColor);
    //},

    onClickMapCountry(code) {
      Vue.set(this.countries, code, "green");
      this.activeCountry = code;
      this.$modal.show("countryinfo");
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
