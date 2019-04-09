Promise.all([
  d3.json("data/oblast_geo_simple.json"),
  d3.json("data/europe.json"),
  d3.json("data/routesUA.json"),
  d3.json("data/stopsUA.json"),
  d3.json("data/output.json"),
  d3.json("data/international_routes_stops.json"),
]).then(function([o, e, data, stops, international_routes, international_routes_stops]) {
  Vue.config.devtools = true;


  var backgroundRouteColor = "#b7acac";
  var selectedRouteColor = "#EB00FF";

var map = L.map('map', { zoomControl:false }).setView([49.272021, 31.437523], 6);
map.scrollWheelZoom.disable()
map.addControl(L.control.zoom({ position: 'topleft' }));
/* 
var gl = L.mapboxGL({
  accessToken: 'pk.eyJ1IjoicHRyYmRyIiwiYSI6ImNqZG12dWdtYzBwdzgyeHAweDFueGZrYTYifQ.ZJ2tgs6E94t3wBwFOyRSBQ',
  maxZoom: 6,
  minZoom:5,
  pane: 'tilePane'
}).addTo(map); */

data = data.filter(function(d) {
   return d.start || d.end
  });

let nestedStops = d3.nest()
  .key(d => d.id)
  .map(stops); 

/* let nestedStopNames = d3.nest()
  .key(d => d.stop_name)
  .rollup(leaves => leaves[0].stop_code)
  .entries(stops); 
 */
      
var data_int = international_routes.filter(function(d) {
  return d.start || d.end
  });

let nestedStops_int = d3.nest()
  .key(d => d.id)
  /* .rollup(leaves => leaves[0].stop_code) */
  .map(international_routes_stops);

/* let nestedStopNamesInt = d3.nest()
  .key(d => d.stop_name)
  .rollup(leaves => leaves[0].stop_code)
  .entries(international_routes_stops); */

let allPointsData = [
  ...data.map(d => d.start),
  ...data.map(d => d.end)
];
let allPointsDataInt = [
  ...data_int.map(d => d.start),
  ...data_int.map(d => d.end)];

var geojson = allPointsData.map(function (d) {
  return {
      type: "Feature",
      properties: d,
      geometry: {
          type: "Point",
          coordinates: [+d.coords[1], +d.coords[0]]
      }
  }
});

var geojsonInt = allPointsDataInt.map(function (d) {
  return {
      type: "Feature",
      properties: d,
      geometry: {
          type: "Point",
          coordinates: [+d.coords[1], +d.coords[0]]
      }
  }
});

s = new Set()
geojson = geojson.filter(d => {
  if (!s.has(d.properties.cityCode)) {
    s.add(d.properties.cityCode);
    return d
  }
})

sInt = new Set()
geojsonInt = geojsonInt.filter(d => {
  if (!sInt.has(d.properties.cityCode)) {
    sInt.add(d.properties.cityCode);
    return d
  }
})

var max = d3.max(geojson.map(d => d.properties.freq));
var maxInt = d3.max(geojsonInt.map(d => d.properties.freq));


var scale = d3
    .scaleLog()
    .domain([1, max]) // input
    .range([1, 2]); // output

var scaleInt = d3
  .scaleLog()
  .domain([1, max]) // input
  .range([2, 5]); // output

var markers = L.geoJSON(geojson, {
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: scale(feature.properties.freq),
      fillColor: "#808080",
      color: "#000",
      weight: 1,
      opacity: 0,
      fillOpacity: 0.5,
      bubblingMouseEvents: false
    });
  }
}).addTo(map);


map.fitBounds(markers.getBounds());

var markersInt = L.geoJSON(geojsonInt, {
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: scaleInt(feature.properties.freq),
      fillColor: "#808080",
      color: "#000",
      weight: 1,
      opacity: 0,
      fillOpacity: 0.5,
      bubblingMouseEvents: false
    });
  }
});


markers.on('click', function(d){
  var a = d.sourceTarget.feature.properties.cityCode;
  store.commit('change', a);
  overlay.redraw({redraw:true, data:store.getters.routesToDisplay});
});

markers.on('mouseover', d => {
  d.layer.setStyle({fillColor: selectedRouteColor});
  popup = L.popup({closeButton: false})
      .setLatLng(d.latlng)
      .setContent(d.layer.feature.properties.cityName)
      .openOn(map);

});


markers.on('mouseout', d => {
  d.layer.setStyle({fillColor: "#929292"});

  map.closePopup();

});

markersInt.on('click', function(d){
  var a = d.sourceTarget.feature.properties.cityCode;
  store.commit('change', a);
  overlay.redraw({redraw:true, data:store.getters.routesToDisplay});
});

markersInt.on('mouseover', d => {
  d.layer.setStyle({fillColor: selectedRouteColor});
  popup = L.popup({closeButton: false})
      .setLatLng(d.latlng)
      .setContent(d.layer.feature.properties.cityName)
      .openOn(map);

});


markersInt.on('mouseout', d => {
  d.layer.setStyle({fillColor: "#929292"});

  map.closePopup();

});

  const store = new Vuex.Store({
    state: {
      routes: data,
      nestedStops: nestedStops,
      /* nestedStopNames: nestedStopNames, */
      selectedCity: '4610100000',
      redrawMap: false,
      screen: 'oblast'
    },
    mutations: {
      change(state, n) {
        state.selectedCity = n
      },
      redrawMap(state) {
        state.redrawMap = !state.redrawMap;
      },
      changeDataInt(state) {
        store.state.routes = data_int,
        store.state.nestedStops = nestedStops_int;
        /* store.state.nestedStopNames = nestedStopNamesInt; */
        store.state.selectedCity = '4610100000'
        store.state.screen = 'internatation';

        states.clear();
        states.local = store.getters.nestedStopNames.map(d => d.key.trim());
        states.initialize(true);

        background.redraw({redraw:true, data:store.state.routes});
        overlay.redraw({redraw:true, data:store.getters.routesToDisplay});

        markers.remove();
        oblastBoundaries.remove();
        europe.addTo(map);
        markersInt.addTo(map);
        map.fitBounds(markersInt.getBounds());
       /*  map.setView([49.842602, 24.027704], 5) */

      }, 
      changeDataObl(state) {
        store.state.routes = data, 
        store.state.nestedStops = nestedStops
        /* store.state.nestedStopNames = nestedStopNames; */
        store.state.selectedCity = '4610100000'
        store.state.screen = 'oblast'
        background.redraw({redraw:true, data:store.state.routes});
        overlay.redraw({redraw:true, data:store.getters.routesToDisplay});

        states.clear();
        states.local = store.getters.nestedStopNames.map(d => d.key.trim());
        states.initialize(true);

        markersInt.remove();
        europe.remove();
        oblastBoundaries.addTo(map);
        markers.addTo(map);
        map.fitBounds(markers.getBounds());
        /* map.setView([49.272021, 31.437523], 6); */

      }
    },
    getters: {
      routesToDisplay: state => {
        return state.routes.filter(d => {
          return d.start.cityCode == state.selectedCity || d.end.cityCode == state.selectedCity
        })
      },
      nestedStopNames: function(state){
        var stops = [];
        
        state.routes.forEach(function(r){
          stops.push({key: r.start.cityName, value: r.start.cityCode})
          stops.push({key: r.end.cityName, value: r.end.cityCode})
        })

        return stops     
      },
      selectedCityName: function(state){
        return store.getters.nestedStopNames.filter(d => d.value == state.selectedCity)[0].key
      },
    },
    actions: {
      changeData(state) {
        alert('changing')
        if (store.state.screen == 'oblast') {
            return state.mutations.commit('changeDataInt');
        }
      }
    }
  })

var states = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  // `states` is an array of state names defined in "The Basics"
  local: store.getters.nestedStopNames.map(d => d.key.trim())
});


$('#bloodhound .typeahead').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
  },
  {
      name: 'states',
      source: states
  });

  $('.typeahead').on('typeahead:selected', function(evt, item) {
    $(this).val("");

    var selected = store.getters.nestedStopNames.filter(d => d.key == item)[0].value
    store.commit('change', selected);
    overlay.redraw({redraw:true, data:store.getters.routesToDisplay});
  
  })



/* var map = L.map('map', { zoomControl:false }).setView([49.272021, 31.437523], 6);
map.scrollWheelZoom.disable()
map.addControl(L.control.zoom({ position: 'topleft' })); */


    let oblastBoundaries = L.geoJSON(o, {
      color:"#968787",
      fill: "#000",
      weight:1,
      fillOpacity: 0,
      opacity: 0.5,
      bubblingMouseEvents: false
    }).addTo(map);

    oblastBoundaries.bringToBack();

    let europe = L.geoJSON(e, {
      color:"#968787",
      fill: "#000",
      weight:1,
      fillOpacity: 0,
      opacity: 0.5,
      bubblingMouseEvents: false
    })

    europe.bringToBack();



var gl = L.mapboxGL({
    accessToken: 'pk.eyJ1IjoicHRyYmRyIiwiYSI6ImNqZG12dWdtYzBwdzgyeHAweDFueGZrYTYifQ.ZJ2tgs6E94t3wBwFOyRSBQ',
    maxZoom: 19,
/*     minZoom:5,
 */    pane: 'tilePane'
}).addTo(map);

  var background = countryOverlay.draw(map, store.state.routes, backgroundRouteColor, 0.5);
  var overlay =  countryOverlay.draw(map, store.getters.routesToDisplay, selectedRouteColor, 1);



  var timetable = Vue.component('table-route-timetable', {
    props: {
      routeid: String
    },
    data() {
      return {
        routeid: this.routeid,
        show: false,
        direction: true,
      }
    },
    methods: {
      headerClick: function() {
        this.show = !this.show
      },
    },
    computed: {
      selectedRoute: function(){
        return store.state.nestedStops.get(this.routeid);
      },
      routeListInt: function() {
        if (this.direction) {
          return this.selectedRoute.sort(function(a, b){
            return +a.stop_order_number - +b.stop_order_number;
        });
        }
        else {
          return this.selectedRoute.slice().sort(function(a, b){
            return +b.stop_order_number - +a.stop_order_number;
        });
        }
      },
    },
    watch: {
        show: function(val) {
          if (val == false) {
            this.direction = true;
          }
        }
      },
  template: 
  `
  <div>
    <button :class="{schedule: true, active: show}" @click="headerClick"> Розклад </button>
    <div v-if="show">
      <button @click="direction = !direction" :class="{direction: true, straight: direction}">
        {{ direction ? "Прямий" : "Зворотній" }}
      </button>
      <p v-for="(item, index) in routeListInt"
          :key="index"
          class="route_row"
      >
        <span class="stop_name">
          {{ item.stop_name }}
        </span>
        <span class="stop_name">
          {{ direction ? item.arrival_direct : item.arrival_return }}
        </span>
      </p>
    </div>
  </div>
  `
});


  var tableRoute = Vue.component('table-route', {
    props: {
      idx: Number,
      show: Boolean,
      id: String,
      name: String,
      company_name: String,
      license_data: String,
      bus_age: String,
      route_regularity: String,
      bus_comfort_level: String,
      destionation_country_name: String,
      border_crossing: String
    },

    data: function () {
      return {
        show: true,
      }
    },

    component: {
      'table-route-timetable': timetable
    },

    methods: {
      open: function() {
        this.$emit('selected');
      },
    },

    template: 
    `
    <div class="city_route" :class="{active: show}">
      <h3 @click="$emit('update:selected', idx)">
        {{ name }}
      </h3>
      <div v-if="show" class="route_details">
      <p>{{  company_name != null ?  "Перевізник: " + company_name : ""}} </p>
      <p>Тривалість ліцензії: {{  license_data != null ?  license_data : "немає даних" }} </p>
      <p>{{ bus_age != null ? "Найстарший автобус на маршруті:" +  bus_age : "" }} </p>
      <p class="comfort" >{{  bus_comfort_level != null ? "Клас комфортності: " + bus_comfort_level : ""  }} </p>
      <p>{{ route_regularity != null ? "Частота: " + route_regularity : ""  }} </p>
      <p>{{ border_crossing != null ? "Пункт перетину кордону: " + border_crossing : ""  }} </p>
      <p>{{ destionation_country_name != null ? "Частота: " + destionation_country_name : ""  }} </p>

      <table-route-timetable :routeid="id"></table-route-timetable>
    </div>
    `
  });

  Vue.component('table', {
  data: function () {
    return {
    }
  },
  methods: {
    changeToInternational: function() {
      /* store.actions.changeData; */
    }
  },
  component: {
    'table-route': tableRoute
  },
  template: 
  `
    <div>
    <button @click="changeToInt"></button>
      <table-route v-for="(name, index) in selectedStop" 
      v-bind:key="index"
      :selected.sync="selected"
      :idx="index"
      :show="selected == index"
      :name="name.march_route_name" 
      :company_name="name.company_name"
      :license_data="name.license_terms"
      :bus_age="name.bus_age"
      :route_regularity="name.march_route_regularity"
      :bus_comfort_level="name.bus_comfort_level"
      :id="name.id"
      >
      </table-route>   
  </div>
  `
})


new Vue({ 
  el: '#app' ,
  store,
  data: {
    selected: null,
    iD: 'UA300'
  },
  methods: {
    changeToInternational: function() {
      store.commit('changeDataInt');
    },
    changeToOblast: function() {
      store.commit('changeDataObl');
    },
  },
  computed: {
    timetable: function(){
      return store.state.nestedStops.get(this.iD)
    },
    selectedStop: function() {
      return store.getters.routesToDisplay
    },
    selectedCityName: function() {
      return store.getters.selectedCityName
    },
    screen: function() {
      return store.state.screen
    }
  },
  mounted() {
    document.getElementById('loading').remove()
  },
  // watch: {
  //   selectedStop: function(val) {
  //     overlay = overlay.draw(map, val, selectedRouteColor, 1);
  //   }
  // }
})

});




