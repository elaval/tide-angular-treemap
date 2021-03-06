
"use strict";
/* jshint undef: true, unused: true */
/* global angular */

/**
 * @ngdoc directive
 * @name tide-angular.directive:tdTreemap
 * @requires $compile
 * @requires underscore._
 * @requires d3service.d3
 * @requires tideLayoutTreemap
 * @requires toolTip
 * @element div
 * 
 * @param {array} tdData Data array used for populating the chart
 * @param {string} tdXattribute Name of the attribute used organizing columns with different categories
 * @param {string} tdIdAttribute Name of the attribute used for the ID of unique entities in teh data set
 * @param {string} tdSizeAttribute Name of the attribute used for defining the size of the elements (i.e. number of students)
 * @param {string} tdColorAttribute Name of the attribute used to define the color categories in the chart
 * @param {function=} tdTooltipMessage Function that should return a text to be displayed in the tooltip, given a data element
 * @param {int=} tdWidth Chart widht 
 * @param {int=} tdHeight Chart height 
 * @param {array=} tdColorLegend Array that returns the color codes used in the legend each element is an array ["category", "color"]
 * @param {string} tdUnidad Label with unit used for the size of the elements (Ex:  "Students")
 * @description
 *
 * Generates a Treemap with the total population distributed in "rectangles" acording to the size of each record
 * records are grouped in Columns (Ex. "Type of school") and Colors (Ex "zone") ... allowing to visualize the distribution of the population according to 2 main categories and within each unit of analisis (Ex School)
 *
 */
 angular.module("tide-angular")
 .directive("tdTreemap",["$compile","_", "d3","tideLayoutTreemap", "toolTip",function ($compile,_, d3, layout, tooltip) {
   return {
    restrict: "A",
      //transclude: false,
      //template: "<div style='background-color:red' ng-transclude></div>",
      
      scope: {

        data: "=tdData",
        xAttribute: "=tdXAttribute",
        sizeAttribute: "=tdSizeAttribute",
        idAttribute: "=?tdIdAttribute",
        tooltipMessage: "=?tdTooltipMessage",

        width: "=?tdWidth",
        height: "=?tdHeight",
        unidad: "=?tdUnidad",

        // Bubble color
        colorAttribute: "=tdColorAttribute",
        keyAttribute: "=tdKeyAttribute",

        colorLegend: "=?tdColorLegend"
        

      },
      
      link: function (scope, element, attrs) {

        var width = scope.width ? +scope.width : 800;
        var height = scope.height ? +scope.height : 400;
        var margin = {};
        margin.left = scope.options && scope.options.margin && scope.options.margin.left ? scope.options.margin.left : 20;
        margin.right = 20;
        margin.top = 20;
        margin.bottom = 40;

        //scope.colorAttribute = scope.colorAttribute ? scope.colorAttribute : "color";

        var color = d3.scale.category10();

        var size = [width,height];  

        
        layout
        .size([width,height]) 
        .sizeAttribute(scope.sizeAttribute)
        .xAttribute(scope.xAttribute )
        .colorAttribute(scope.colorAttribute)


        // Div principal
        var mainDiv = d3.select(element[0]).append("div")
        .style("position", "relative")
        .style("width", (width + margin.left + margin.right) + "px")
        .style("height", (height + margin.top + margin.bottom) + "px")
        .style("left", margin.left + "px")
        .style("top", margin.top + "px");

        var titlesDiv = mainDiv.append("div")
            .style("position", "relative")
            .style("width", width + "px")
            .style("height", 40 + "px")
            .style("left", 0 + "px")
            .style("top", 0 + "px")


        // Define dataPoints tooltip generator
        var dataTooltip = tooltip();
        if (scope.tooltipMessage) {
          dataTooltip.message(scope.tooltipMessage);
        } else {
          dataTooltip.message(function(d) {
            var msg = scope.xAttribute + " : " + d[scope.xAttribute];
            msg += "<br>" + scope.yAttribute +  " : " + d[scope.yAttribute];

            return  msg;
          });
        }

        /**
        * resize
        */
        var resize = function() {

          width = scope.width ? +scope.width : 800;
          height = scope.height ? +scope.height : 400;

          size = [width,height];  

          layout
          .size([width,height]) 

          mainDiv
            .style("width", (width + margin.left + margin.right) + "px")
            .style("height", (height + margin.top + margin.bottom) + "px");

          }


          var render = function(data) {
            if (data) {


                var colorCategories = _.keys(_.groupBy(data, function(d) {return d[scope.colorAttribute]})).sort();
                color.domain(colorCategories);

            // Color legend data to be shared through the scope
            scope.colorLegend = [];
            _.each(color.domain(), function(d) {
              scope.colorLegend.push([d, color(d)]);
            })


            layout
            .sizeAttribute(scope.sizeAttribute)
            .xAttribute(scope.xAttribute)
            .colorAttribute(scope.colorAttribute)

            var nodes = layout.nodes(data);

            var formatNumber = d3.format(",d");

            var titles = layout.titles();

            d3.selectAll(".etiqueta").remove();

            titlesDiv
            .style("width", width + "px")

            var titles = titlesDiv.selectAll(".title")
            .data(titles)

            titles
              .enter()
              .append("div")
              .attr("class","title")
              .style("float", "left")
              .style("position", "relative")
              .style("width", function(d) {return d.width+"px"})
              .append("div")
              .attr("class", "etiqueta")


            titles
              .style("width", function(d) {return d.width+"px"})
              .html(function(d) {
                return d.title +"<br>"+formatNumber(d.size) +" "+ scope.unidad    
              });

            var divNodes =  mainDiv.selectAll(".node")
            .data(nodes, function(d) {return d[scope.keyAttribute]})

            divNodes
            .exit()
            .transition()
            .attr("opacity", 0)
            .remove()

            divNodes
            .enter()
            .append("div")
            .attr("class", function(d) {
                    // Si son carreras
                    if (d.depth == 1) {
                      return "node leaf";
                    } else  {
                      return "node notleaf"
                    }
                  })
            .style("-webkit-box-sizing", "content-box")
            .style("-moz-box-sizing", "content-box")
            .style("box-sizing", "content-box")
            .text(function(d) { return d.children ? null : d.key; })
            .on("mouseenter", function(d) {
             if(d.depth !=0){
               dataTooltip.show(d)
             }
           })
            .on("mouseleave", function(d) {
             dataTooltip.hide()
           })

          divNodes
            .call(position)
            .style("background", function(d) { 
             return (!d.values && d.depth==1) ? color(d[scope.colorAttribute]) : null;
           })

          }
          
        }

        var position = function() {
          this.style("left", function(d) { 
            return d.x + "px"; 
          })
          .style("top", function(d) { 
            return d.y +40 + "px"; 
          })
          .style("width", function(d) { 
           return Math.max(0, d.dx - 1) + "px"; 
         })
          .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
        }


        render(scope.data);

        scope.$watch("data", function () {
          render(scope.data);
        });      


        scope.$watch("colorAttribute", function () {
          render(scope.data);
        });

        scope.$watch("width", function () {
          resize();
          render(scope.data);
        });

      }

    }

  }]);



/**
* @ngdoc service
* @name tide-angular.tideLayoutTreemap
* @requires d3service.d3
* @requires underscore._
*
* @description
* Creates a layout (node array with position attributes) for building an Treemap Chart
*
*/
angular.module("tide-angular")
.service ("tideLayoutTreemap", ["d3","_", function(d3,_) {
  var size = [1,1];
  var sizeAttribute  = "";
  var colorAttribute = "";
  var xAttribute    = "";
  var titles = [];

  this.nodes = function(data) {
    var dataGroups = createDataGroups(data);

    // sizes  : Objeto con los tamaños de cada grupo
    // Ej. sizes = {"CFT": 120340, "IP": 45687, ...}
    var sizes = calculateGroupSizes(dataGroups);

    // totalSize tamaño total de todos los nodos (Ej totalSize = 956875)
    var totalSize = calculateTotalSize(data);

    // ancho y alto del área de despliegue
    var w = size[0];
    var h = size[1];

    // Arreglo con las obicaciones de cada nodo
    var nodes = []

    var nextX = 0;  // Position of next group Node
    _.each(d3.keys(sizes).sort(), function(key) {
        var groupNode = {};
        groupNode.dx = w*sizes[key]/totalSize;
        groupNode.dy = h;
        groupNode.x = nextX;
        nextX = nextX + groupNode.dx;
        groupNode.y = 0;
        groupNode.depth = 0
        nodes.push(groupNode);

        var groupNodes = createGroupNodes(dataGroups[key], groupNode.x, groupNode.y, groupNode.dx, groupNode.dy, sizes[key]);
        nodes = nodes.concat(groupNodes);

    })

    // Genera un arreglo con texto y ancho de cada titulo
    titles = createTitles(sizes, totalSize);

    return nodes;
  };

  this.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return this;
  }

  this.sizeAttribute = function(_) {
      if (!arguments.length) return sizeAttribute;
      sizeAttribute = _;
      return this;
  };

  this.colorAttribute = function(_) {
      if (!arguments.length) return colorAttribute;
      colorAttribute = _;
      return this;
  };

  this.xAttribute = function(_) {
      if (!arguments.length) return xAttribute;
      xAttribute = _;
      return this;
  };


  this.titles = function() {
    return titles;
  }

  var createTitles = function(sizes, totalSize) {
    var titles = [];

    _.each(d3.keys(sizes).sort(), function(key) {
      var w = size[0];

      var title = {}
      title.title = key;
      title.width = w*sizes[key]/totalSize;
      title.size = sizes[key];

      titles.push(title);
    });

    return titles;
  }

  var createDataGroups = function(data) {
    // Agrupar datos según agrupaciones
    var dataGroups = _.groupBy(data, function(d) {return d[xAttribute]});
    return dataGroups;
  }

  var calculateGroupSizes = function(dataGroups) {

    // Objeto con los tamaños de cada grupo
    var sizes = {};

    _.each(d3.keys(dataGroups), function(key) {
      sizes[key] = _.reduce(dataGroups[key], function(memo, d) {
        return +d[sizeAttribute] + memo;
      }, 0);
    })
    return sizes;
  }

  var calculateTotalSize = function(data) {
    var totalSize =  _.reduce(data, function(memo, d) {
        return +d[sizeAttribute] + memo;
      }, 0);
    return totalSize;
  }

  var createGroupNodes = function(groupData, left, top, width, height, groupSize) {
    // Groups: CFT, IP, ...
    // Categories : Acredidata, No Acreditada

    var withinGroupCategories = _.groupBy(groupData, function(d) {
      return d[colorAttribute];
    });

    var categories = _.sortBy(d3.keys(withinGroupCategories), function(d) {
      return d;
    });

    var nodes = [];

    var nextY = 0
    _.each(categories, function(category) {
      var categorySize = _.reduce(withinGroupCategories[category], function(memo, d) {
        return +d[sizeAttribute] + memo;
      }, 0);

      
      var categoryNode = {};
      categoryNode.dx = width;
      categoryNode.dy = height*categorySize/groupSize;
      categoryNode.x = left;
      categoryNode.y = nextY;
      nextY = nextY + categoryNode.dy;
      
      categoryNode.depth = 0
      nodes.push(categoryNode);

      var nestedData = d3.nest()
        .key(function(d) {return category})
        .entries(withinGroupCategories[category]);
           
      var treemap = d3.layout.treemap()
        .size([categoryNode.dx, categoryNode.dy])
        .sticky(true)
        .children(function(d) {return d.values })
        .value(function(d) { return d[sizeAttribute]; });

      var mapNodes = treemap.nodes(nestedData[0]);

      // Trasladar la posición de cada nodo en función del origen left, top
      mapNodes = _.map(mapNodes, function(d) {
        d.x = d.x+left;
        d.y = d.y+top+categoryNode.y;
        return d
      })

      nodes = nodes.concat(mapNodes);

    });

    return nodes;
  }

}]);

