Promise.all([
  d3.json("data/oblast_geo_simple.json"),
  d3.json("data/europe.json"),
  d3.json("data/routesUA.json"),
  d3.json("data/stopsUA.json"),
  d3.json("data/international_routes.json"),
  d3.json("data/international_routes_stops.json"),
]).then(function([o, e, data, stops, international_routes, international_routes_stops]) {
  Vue.config.devtools = true;
  console.log(international_routes, international_routes_stops);

  data = data.filter(function(d) {
   return d.start || d.end
  });

  let nestedStops = d3.nest()
                      .key(d => d.id)
                      .map(stops);


  const store = new Vuex.Store({
    state: {
      routes: data,
      selectedCity: data[100].start.cityCode,
      redrawMap: false
    },
    mutations: {
      change(state, n) {
        state.selectedCity = n
      },
      redrawMap(state) {
        state.redrawMap = !state.redrawMap;
      }
    },
    getters: {
      routesToDisplay: state => {
        return state.routes.filter(d => d.start.cityCode == state.selectedCity)
        // return state.selectedCity
      }
    },
  })


  var map = L.map('map', { zoomControl:false }).setView([49.272021, 31.437523], 6);

  Promise.all([
    d3.json("data/oblast_geo_simple.json"),
    d3.json("data/europe.json")
  ]).then(function([o, e]) {

    let oblastBoundaries = L.geoJSON(o, {
      color:"#968787",
      fill: "#000",
      weight:1,
      // stroke-width:1,
      fillOpacity: 0,
      opacity: 0.5,
      bubblingMouseEvents: false
    }).addTo(map);

    oblastBoundaries.bringToBack();

    let europe = L.geoJSON(e, {
      color:"#968787",
      fill: "#000",
      weight:1,
      // stroke-width:1,
      fillOpacity: 0,
      opacity: 0.5,
      bubblingMouseEvents: false
    }).addTo(map);

    europe.bringToBack();

  });

/*   d3.json("data/europe.json").then(function(oblast) {
  let oblastBoundaries = L.geoJSON(oblast, {
    color:"#968787",
    fill: "#000",
    weight:1,
    // stroke-width:1,
    fillOpacity: 0,
    opacity: 0.5,
    bubblingMouseEvents: false
  }).addTo(map);

  oblastBoundaries.bringToBack();

  let europe = L.geoJSON(oblast, {
    color:"#968787",
    fill: "#000",
    weight:1,
    // stroke-width:1,
    fillOpacity: 0,
    opacity: 0.5,
    bubblingMouseEvents: false
  }).addTo(map);

  europe.bringToBack();

});
*/

  var backgroundRouteColor = "#b7acac";
  var selectedRouteColor = "#EB00FF";


  var gl = L.mapboxGL({
      accessToken: 'pk.eyJ1IjoicHRyYmRyIiwiYSI6ImNqZG12dWdtYzBwdzgyeHAweDFueGZrYTYifQ.ZJ2tgs6E94t3wBwFOyRSBQ',
      maxZoom: 19,
/*         style: 'style.json',
*/        pane: 'tilePane'
  }).addTo(map);

  let allPointsData = [...data.map(d => d.start), ...data.map(d => d.end)];

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

  s = new Set()
  geojson = geojson.filter(d => {
    if (!s.has(d.properties.cityCode)) {
      s.add(d.properties.cityCode);
      return d
    }
  })

  var max = d3.max(geojson.map(d => d.properties.freq));

  var scale = d3
      .scaleLog()
      .domain([1, max]) // input
      .range([3, 12]); // output

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

  markers.on('click', function(d){
    // console.log(d.target.properties);
    var a = d.sourceTarget.feature.properties.cityCode;
    var res = data.filter(d => d.start.cityCode == a)

    console.log(nestedStops.get(a));
    store.commit('change', a);
/*       store.commit('redrawMap');
*/      // overlay.redraw();
    overlay.redraw({redraw:true, data:store.getters.routesToDisplay});
  });


  // let selectedRoutes =  data.slice(0, 100);
  var background = countryOverlay.draw(map, store.state.routes, backgroundRouteColor, 0.5);
  var overlay =  countryOverlay.draw(map, store.getters.routesToDisplay, selectedRouteColor, 1);

  // background.draw(map, data, backgroundRouteColor, 0.5);
  // overlay.draw(map, store, selectedRouteColor, 1);


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
        // this.$emit('openedRouteDetails');
        this.show = !this.show
        // this.setRouteID(this.$props.id);
      },
      // close: function() {
      //   this.show = hide;
      // }     
    },
    computed: {
      selectedRoute: function(){
        return nestedStops.get(this.routeid);
      },
      routeList: function() {
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
    <h3 @click="headerClick"> Розклад </h3>
    <div v-if="show">
      <button @click="direction = !direction">
        {{ direction ? "Прямий" : "Зворотній" }}
      </button>
      <p v-for="(item, index) in routeList"
          v-bind:key="index"
      >        
        {{
          direction 
          ? item.stop_name + " | " 
          + item.arrival_direct 
          : item.stop_name +  " | " 
          + item.arrival_return
        }}
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
    <div>
      <h3 @click="$emit('update:selected', idx)"> {{ name }} </h3>
      <div v-if="show">
      <p>Перевізник: {{  company_name != null ?  company_name : "немає даних"}} </p>
      <p>Тривалість ліцензії: {{  license_data != null ?  license_data : "немає даних" }} </p>
      <p>Найстарший автобус на маршруті: {{ bus_age != null ?  bus_age : "немає даних" }} </p>
      <p>Клас комфортності: {{  bus_comfort_level != null ?  bus_comfort_level : "немає даних"  }} </p>
      <p>Частота: {{ route_regularity != null ?  route_regularity : "немає даних"  }} </p>
  
      <table-route-timetable :routeid="id"></table-route-timetable>

    </div>
    `
  });

  Vue.component('table', {
  data: function () {
    return {
    }
  },
  component: {
    'table-route': tableRoute
  },
  template: 
  `
    <div>
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
    // selectedStop: store.getters,
    selected: null,
    iD: 'UA300'
  },
  computed: {
    timetable: function(){
      return nestedStops.get(this.iD)
    },
    selectedStop: function() {
      return store.getters.routesToDisplay
    }
  },
  mounted() {
    console.log(store.getters.routesToDisplay);
  },
  // watch: {
  //   selectedStop: function(val) {
  //     overlay = overlay.draw(map, val, selectedRouteColor, 1);
  //   }
  // }
})

});


