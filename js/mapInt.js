Promise.all([
    d3.json("data/oblast_geo_simple.json"),
    d3.json("data/europe.json"),
    d3.json("data/routesUA.json"),
    d3.json("data/stopsUA.json"),
    d3.json("data/international_routes.json"),
    d3.json("data/international_routes_stops.json"),
  ]).then(function([o, e, data, stops, international_routes, international_routes_stops]) {
    Vue.config.devtools = true;
  
    var data = international_routes.filter(function(d) {
     return d.start || d.end
    });
  
    let nestedStops = d3.nest()
      .key(d => d.id)
      .map(international_routes_stops);
  
  
  
    const storeInt = new Vuex.Store({
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
  
  
    var map = L.map('map-int', { zoomControl:false }).setView([49.272021, 31.437523], 5);
  
    map.scrollWheelZoom.disable()
    map.addControl(L.control.zoom({ position: 'topleft' }));


    window.map = map;
  
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
  
  
    var backgroundRouteColor = "#b7acac";
    var selectedRouteColor = "#EB00FF";
  
  
    var gl = L.mapboxGL({
        accessToken: 'pk.eyJ1IjoicHRyYmRyIiwiYSI6ImNqZG12dWdtYzBwdzgyeHAweDFueGZrYTYifQ.ZJ2tgs6E94t3wBwFOyRSBQ',
        maxZoom: 6,
        minZoom:5,
  /*         style: 'style.json',
  */        pane: 'tilePane'
    }).addTo(map);
  
    let allPointsData = [...storeInt.state.routes.map(d => d.start), ...storeInt.state.routes.map(d => d.end)];
  
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
  
    markers.on('click', function(d){
      // console.log(d.target.properties);
      var a = d.sourceTarget.feature.properties.cityCode;
      var res = data.filter(d => d.start.cityCode == a)
  
      console.log(nestedStops.get(a));
      storeInt.commit('change', a);
  /*       store.commit('redrawMap');
  */      // overlay.redraw();
      overlay.redraw({redraw:true, data:storeInt.getters.routesToDisplay});
    });
  
  
    // let selectedRoutes =  data.slice(0, 100);
    var background = countryOverlay.draw(map, storeInt.state.routes, backgroundRouteColor, 0.5);
    var overlay =  countryOverlay.draw(map, storeInt.getters.routesToDisplay, selectedRouteColor, 1);
  
    // background.draw(map, data, backgroundRouteColor, 0.5);
    // overlay.draw(map, store, selectedRouteColor, 1);
  
  
    var timetableInt = Vue.component('table-route-timetable-int', {
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
  
  
    var tableRouteInt = Vue.component('table-route', {
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
        'table-route-timetable-int': timetableInt
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
    
        <table-route-timetable-int :routeid="id"></table-route-timetable-int>
  
      </div>
      `
    });
  
    Vue.component('table', {
    data: function () {
      return {
      }
    },
    component: {
      'table-route': tableRouteInt
    },
    template: 
    `
      <div>
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
    el: '#app-int' ,
    storeInt,
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
        return storeInt.getters.routesToDisplay
      }
    },
    mounted() {
      console.log(storeInt.getters.routesToDisplay);
    },
    // watch: {
    //   selectedStop: function(val) {
    //     overlay = overlay.draw(map, val, selectedRouteColor, 1);
    //   }
    // }
  })
  
  });
  
  
  