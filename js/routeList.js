function createSideNav(march_route_list) {

    march_route_list.values = march_route_list.values
        .sort((a, b) => a.second.localeCompare(b.second));


    d3.select('.table').selectAll('*').remove();

    d3.select('div.search .cityName b p')
        .text( march_route_list.key );

    var cityNames = d3.select('div.table').append('div');
    // .text(march_route_list.key)
    // .attr('class', 'cityTitle');


    var occurance = [];

    var routes = d3.select('div.table').selectAll('div')
        .data(march_route_list.values)
        .enter()
        .append('div')
        .attr('class', function (d) {
            return 'routeInfo'
        })
        .attr('data', function (d) {
            return d.first.trim() + ' - ' + d.second.trim()
        })
        .html(function (d) {

            var ind = occurance.findIndex(dd => dd.name === d.second);

            if (ind > 0) {
                occurance[ind].count += 1;
            }
            else {
                occurance.push({name:d.second, count:1});
                ind = occurance.findIndex(dd => dd.name === d.second);
            }

            var title;
            if (occurance[ind].count > 1) {
                title = occurance[ind].name + " (" +  occurance[ind].count + ")"
            }
            else {
                title = occurance[ind].name
            }

            return `
            <p class="routeTitle">${title}</p>
            <p data="${ d.id }" title="Показати всі маршрути цієї компанії" style="color: #EB00FF" id="${ d.company_id }" class="routeProperty">${ d.company_name.length > 5 ? 'Перевізник: ' + d.company_name  : 'Перевізник: немає даних' }</p>
            <p class="routeProperty">${ d.license_data.length > 3 ? 'Тривалість ліцензії: ' + d.license_data : 'Тривалість ліцензії: немає даних'}</p>
            <p class="routeProperty">${ d.bus_age.length > 3 ? 'Найстарший автобус на маршруті: ' + d.bus_age : 'Найстарший автобус на маршруті: немає даних'}</p>
            <p class="routeProperty">${ d.bus_comfort_level.length > 3 ? 'Клас комфортності автобусів: ' + d.bus_comfort_level : 'Клас комфортності автобусів: немає даних'}</p>
            <p class="routeProperty">${ d.route_regularity.length > 3 ? 'Частота: ' + d.route_regularity : 'Частота: немає даних'}</p>
            `
        });




} 



/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
var countryOverlay = (function() {
    var module = {};
  
    module.draw = function(map, data, routeColor, width) {
        
    }
  
    module.check = 'Yes';
  
    return module;
  })();
  