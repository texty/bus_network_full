Promise.all([
  d3.json("data/oblast_geo_simple.json"),
  d3.json("data/europe.json"),
  d3.json("data/routesUA.json"),
  d3.json("data/stopsUA.json"),
  d3.json("data/international_routes.json"),
  d3.json("data/international_routes_stops.json"),
]).then(function([o, e, data, stops, international_routes, international_routes_stops]) {
  Vue.config.devtools = true;

var map = L.map('map', { zoomControl:false }).setView([49.272021, 31.437523], 6);
map.scrollWheelZoom.disable()
map.addControl(L.control.zoom({ position: 'topleft' }));

var gl = L.mapboxGL({
  accessToken: 'pk.eyJ1IjoicHRyYmRyIiwiYSI6ImNqZG12dWdtYzBwdzgyeHAweDFueGZrYTYifQ.ZJ2tgs6E94t3wBwFOyRSBQ',
  maxZoom: 19,
  pane: 'tilePane'
}).addTo(map);

data = data.filter(function(d) {
   return d.start || d.end
  });

let nestedStops = d3.nest()
  .key(d => d.id)
  .map(stops); 

      
var data_int = international_routes.filter(function(d) {
  return d.start || d.end
  });

let nestedStops_int = d3.nest()
  .key(d => d.id)
  .map(international_routes_stops);


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
    .range([3, 12]); // output

var scaleInt = d3
  .scaleLog()
  .domain([1, max]) // input
  .range([2, 6]); // output

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
  var res = data.filter(d => d.start.cityCode == a)
  store.commit('change', a);
  overlay.redraw({redraw:true, data:store.getters.routesToDisplay});
});

markersInt.on('click', function(d){
  var a = d.sourceTarget.feature.properties.cityCode;
  var res = data.filter(d => d.end.cityCode == a)
  store.commit('change', a);
  overlay.redraw({redraw:true, data:store.getters.routesToDisplay});
});



  const store = new Vuex.Store({
    state: {
      routes: data,
      nestedStops: nestedStops,
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
        store.state.selectedCity = '4610100000'
        store.state.screen = 'internatation';
        background.redraw({redraw:true, data:store.state.routes});
        overlay.redraw({redraw:true, data:store.getters.routesToDisplay});

        markers.remove();
        oblastBoundaries.remove();
        europe.addTo(map);
        markersInt.addTo(map);
        map.setView([49.272021, 31.437523], 5)

      }, 
      changeDataObl(state) {
        store.state.routes = data, 
        store.state.nestedStops = nestedStops
        store.state.selectedCity = '4610100000'
        store.state.screen = 'oblast'
        background.redraw({redraw:true, data:store.state.routes});
        overlay.redraw({redraw:true, data:store.getters.routesToDisplay});

        markersInt.remove();
        europe.remove();
        oblastBoundaries.addTo(map);
        markers.addTo(map);
        map.setView([49.272021, 31.437523], 6);

      }
    },
    getters: {
      routesToDisplay: state => {
        return state.routes.filter(d => d.start.cityCode == state.selectedCity || d.end.cityCode == state.selectedCity)
      }
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

  var backgroundRouteColor = "#b7acac";
  var selectedRouteColor = "#EB00FF";


var gl = L.mapboxGL({
    accessToken: 'pk.eyJ1IjoicHRyYmRyIiwiYSI6ImNqZG12dWdtYzBwdzgyeHAweDFueGZrYTYifQ.ZJ2tgs6E94t3wBwFOyRSBQ',
    maxZoom: 19,
    pane: 'tilePane'
}).addTo(map);

  /* let allPointsData = [...store.state.routes.map(d => d.start), ...store.state.routes.map(d => d.end)];

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
    var a = d.sourceTarget.feature.properties.cityCode;
    var res = data.filter(d => d.start.cityCode == a)
    store.commit('change', a);
    overlay.redraw({redraw:true, data:store.getters.routesToDisplay});
  }); */


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
    <h3 @click="headerClick"> Розклад </h3>
    <div v-if="show">
      <button @click="direction = !direction">
        {{ direction ? "Прямий" : "Зворотній" }}
      </button>
      <p v-for="(item, index) in routeListInt"
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
    <button></button>
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
  methods: {
    changeToInternational: function() {
      /* store.actions.changeData() */
      store.commit('changeDataInt');
    },
    changeToOblast: function() {
      /* store.actions.changeData() */
      store.commit('changeDataObl');
    },
  },
  computed: {
    timetable: function(){
      return store.state.nestedStops.get(this.iD)
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




