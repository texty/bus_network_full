var countryOverlay = (function() {
  var module = {};


  // var redrawMap = false;

  // module.redraw = function(){
  //   redrawMap = true;
  // }

  module.draw = function(map, data, routeColor, width) {
    // передати геоджейсон, щоб намалювати точко
    // передати координати міст, щоб намалювати лінії

    var tree = rbush();



    var backgroundOverlay = (function() {
      var frame = null;
      var firstDraw = true;
      var prevZoom;


      var pixiContainer = new PIXI.Graphics();
      pixiContainer.interactive = true;
      pixiContainer.buttonMode = true;

      var doubleBuffering =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      return L.pixiOverlay(
        function(utils) {
          if (frame) {
            cancelAnimationFrame(frame);
            frame = null;
          }
          var zoom = utils.getMap().getZoom();
          var container = utils.getContainer();
          var anotherContainer = utils.getContainer();
          var renderer = utils.getRenderer();
          var project = utils.latLngToLayerPoint;
          var scale = utils.getScale();

          if (firstDraw) {
            var getRenderer = utils.getRenderer;
            utils.getMap().on("click", function(e) {
              // not really nice but much better than before
              // good starting point for improvements
              var interaction = utils.getRenderer().plugins.interaction;
              var pointerEvent = e.originalEvent;
              var pixiPoint = new PIXI.Point();
              // get global click position in pixiPoint:
              interaction.mapPositionToPoint(
                pixiPoint,
                pointerEvent.clientX,
                pointerEvent.clientY
              );
              // get what is below the click if any:
              var target = interaction.hitTest(pixiPoint, container);
              if (target && target.popup) {
                target.popup.openOn(map);
              }
            });
          }
          if (firstDraw || prevZoom !== zoom || arguments[1].redraw) {
            // container.clear();
            drawSelected(data);

            if (arguments[1].redraw) {
              drawSelected(arguments[1].data);
              data = arguments[1].data
            }

            function drawSelected(data) {
              container.clear();

              data.forEach(function(d) {
                var bounds;
  
                // container.clear();
  
                // if false it would disappear
                container.visible = true;
  
                // var backgroundRouteColor = '#b7acac';
                // container.beginFill(0xFF3300);
                container.lineStyle(
                  width / scale,
                  routeColor.replace("#", "0x"),
                  width
                );
  
                var distance = turf.distance(
                  turf.point(d.start.coords),
                  turf.point(d.end.coords)
                );
  
                var num = Math.random(0, 10); // this will get a number between 1 and 99;
  
                num = (distance / 1000) * num;
                num *= Math.floor(Math.random()*2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases
  
                var midPoint = turf.midpoint(
                  turf.point(d.start.coords),
                  turf.point(d.end.coords)
                ).geometry.coordinates;
                midPoint = [midPoint[0] + num, midPoint[1] + num];
                //
                // // draw a shape
                container.moveTo(project(d.start.coords).x, project(d.start.coords).y);
                //
                container.quadraticCurveTo(
                  project(midPoint).x,
                  project(midPoint).y,
                  project(d.end.coords).x,
                  project(d.end.coords).y
                );
                // container.lineTo(project(d.coords[1]).x, project(d.coords[1]).y);
  
                container.endFill();
  
                bounds = L.bounds(L.bounds([d.start.coords, d.end.coords]));
  
                tree.insert({
                  minX: bounds.min.x,
                  minY: bounds.min.y,
                  maxX: bounds.max.x,
                  maxY: bounds.max.y,
                  feature: d
                });
              });

              // store.commit('redrawMap');
            }
            // redrawMap = false;
          }

          firstDraw = false;
          prevZoom = zoom;
          renderer.render(container);
        },
        pixiContainer,
        {
          doubleBuffering: doubleBuffering,
          autoPreventDefault: false
        }
      );
    })();

    backgroundOverlay.addTo(map);

    return backgroundOverlay;
  };

  module.check = 'Yes';

  return module;
})();
