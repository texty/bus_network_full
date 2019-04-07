d3.csv('data/final_data_full_5.csv')
    .then(function (basic) {
        d3.csv('data/final_coords_full_3.csv')
            .then(function (coords) {
                d3.json('data/oblast_geo.geojson')
                    .then(function (oblastData) {

                        // var oblast_data = oblast.features.map(d => {
                        //     return {name:d.properties.LABEL, data:d}
                        // });
                        //
                        // var polygon_map = d3.nest().key(function (d) {
                        //     return d.name;
                        // }).map(oblast_data);
                        
                        regions.draw(basic, coords, oblastData);
                        country.draw(basic, coords, oblastData);

                        $('main#regions').hide();

                        $('.regions-button').css("background-color", 'lightgray');


                        $('.regions-button').on('click', function () {
                            // $('.country-button').css("background-color", 'lightgray');
                            // $('.regions-button').css("background-color", 'gray');


                            alert('work in progress')
 
                            // $('main#country').hide();
                            // $('main#regions').show();

                            // d3.selectAll('.st1.st2.st3').nodes().forEach(function (d) {
                            //     if (d.innerHTML == 'ЧГ') {
                            //         $(d).click()
                            //     }
                            // });

                        });
                        $('.country-button').on('click', function () {
                            $('main#regions').hide();
                            $('main#country').show();

                            $('.country-button').css("background-color", 'gray');
                            $('.regions-button').css("background-color", 'lightgray');

                        });
                    });
            })
    });