function run() {
  /*
# グラフ入力の書式について
N M
s1 t1 w1
s2 t2 w2
...
sm tm wm

N: ノード数
M: エッジ数
(s_i, t_i, w_i): s->tの重みwのエッジ
有向グラフか無向グラフかはあらかじめ指定しておく
*/
  // HTML内にformで作っておけば直接formのメンバとしてtextareaなどを参照できる
  var graph_area = document.getElementById("graph_output");
  var text_area = document.getElementById("graph_input");

}

function pera() {
  var width = document.querySelector("svg").clientWidth;
  var height = document.querySelector("svg").clientHeight;


  // var svg = d3.select("body").append("svg").attr({
  //   width: width,
  //   height: height
  // });

  var nodeNumber = 30;
  var nodesData = [];

  for (var i = 0; i < nodeNumber; i++) {
    nodesData.push({
      "index": i,
      "x": width * Math.random(),
      "y": height * Math.random(),
      "r": 10
    });
  }

  var linksData = [];
  var i = 0;
  for (var j = i + 1; j < nodeNumber; j++) {
    linksData.push({
      "source": i,
      "target": j,
      "l": Math.random() * 150 + 5 + nodesData[i].r + nodesData[j].r
    });
  }

  var link = d3.select("svg")
    .selectAll("line")
    .data(linksData)
    .enter()
    .append("line")
    .attr("stroke-width", 1)
    .attr("stroke", "black");

  var node = d3.select("svg")
    .selectAll("circle")
    .data(nodesData)
    .enter()
    .append("circle")
    .attr("r", function(d) { return d.r; })
    .attr("fill", "lightSalmon")
    .attr("stroke", "black")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));


    var simulation = d3.forceSimulation()
      .force("link",
        d3.forceLink()
          .distance(function(d) { return d.l; })
          .strength(0.03)
          .iterations(16))
      .force("collide",
        d3.forceCollide()
          .radius(function(d) { return d.r; })
          .strength(0.7)
          .iterations(16))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("x", d3.forceX().strength(0.02).x(width / 2))
      .force("y", d3.forceY().strength(0.02).y(height / 2));

    simulation
      .nodes(nodesData)
      .on("tick", ticked);

    simulation.force("link")
      .links(linksData)
      .id(function(d) { return d.index; });

    function ticked() {
      link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
      node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    }

    function dragstarted(d) {
      if(!d3.event.active)
        simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if(!d3.event.active)
        simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
}


