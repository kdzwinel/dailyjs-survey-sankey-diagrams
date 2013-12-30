(function () {
    var percentage = d3.format('.2%');

    function filterData(sankey, data, minValue) {
        sankey
            .nodes(data.nodes)
            .links(data.links)
            .layout(1);

        //Remove links with value < X
        data.links = data.links.filter(function (d) {
            return d.value > minValue;
        });

        sankey
            .nodes(data.nodes)
            .links(data.links)
            .layout(1);

        //Remove nodes with no links
        data.nodes = data.nodes.filter(function (d) {
            return d.value > 0;
        });

        return data;
    }

    function SankeyDiagram(options) {
        var defaults = {
            margin: {top: 6, right: 1, bottom: 6, left: 1},
            width: 940,
            height: 500,
            color: d3.scale.category20(),
            rootNodeSelector: '#chart'
        };

        this.settings = $.extend({}, defaults, options);
    }

    SankeyDiagram.prototype.draw = function (data, minLinkValue) {
        var settings = this.settings;
        var margin = settings.margin;

        var width = settings.width - margin.left - margin.right,
            height = settings.height - margin.top - margin.bottom;

        d3.select(settings.rootNodeSelector + ' svg').remove();

        var svg = d3.select(settings.rootNodeSelector).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var sankey = d3.sankey()
            .nodeWidth(15)
            .size([width, height]);

        data = filterData(sankey, data, minLinkValue);

        var nodes = data.nodes;
        var links = data.links;

        sankey
            .nodes(nodes)
            .links(links)
            .layout(32);

        var path = sankey.link();

        var link = svg.append("g").selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", path)
            .style("stroke-width", function (d) {
                return Math.max(1, d.dy);
            })
            .sort(function (a, b) {
                return b.dy - a.dy;
            });

        link.append("title")
            .text(function (d) {
                return '"' + d.source.name + '" → "' + d.target.name + '"\n' + d.value + " answers (" + percentage(d.value / d.source.value) + ")";
            });

        var node = svg.append("g").selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .call(d3.behavior.drag()
                .origin(function (d) {
                    return d;
                })
                .on("dragstart", function () {
                    this.parentNode.appendChild(this);
                })
                .on("drag", dragmove));

        node.append("rect")
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth())
            .style("fill", function (d) {
                return d.color = settings.color(d.name.replace(/ .*/, ""));
            })
            .style("stroke", function (d) {
                return d3.rgb(d.color).darker(2);
            })
            .append("title")
            .text(function (d) {
                return '"' + d.name + '"\n' + d.value + ' answers';
            });

        node.append("text")
            .attr("x", -6)
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function (d) {
                return d.name;
            })
            .filter(function (d) {
                return d.x < width / 2;
            })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        function dragmove(d) {
            d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
            sankey.relayout();
            link.attr("d", path);
        }
    };

    window.SankeyDiagram = SankeyDiagram;
})();