/**
 * HTMLからグラフ構築に必要な情報を持ってくるクラス。
 */
class GraphDOMLoader {
  constructor() {
    this.graph_input_id = "graphtext-input";
    this.radio_directed_id = "directed";
    this.radio_undirected_id = "undirected";
    this.radio_zerobased_id = "radio-zero";
    this.radio_onebased_id = "radio-one";

  }

  getGraphTextFromHTML() {
    return document.getElementById(this.graph_input_id).value;
  }

  getIsDirectedFromHTML() {
    const directed = document.getElementById(this.radio_directed_id);
    return directed.checked;
  }

  getIndexBaseFromHTML() {
    const selected = document.getElementById(this.radio_zerobased_id).checked;
    return selected ? 0 : 1;
  }
}

/**
 * グラフテキストを、グラフを表現するデータに変換する
 * @returns {object} グラフを表現するObject。
 */
function convertGraphTextToNumberArray(text) {
  text = text.trim();
  // グラフテキストを行に分割する
  const re_newline = /\n+/
  text_lines = text.split(re_newline);

  // それぞれの行から数値を抽出する。
  // 失敗した場合はErrorが出てくる。
  number_lines = text_lines.map(getNumbersFromLine);

  return number_lines


}

/**
 * 文字列から、含まれている数値をArrayとして返す。
 * @param {string} text - 数値を抽出したい文字列
 * @returns {Array} 数値を含んだ配列
 */
function getNumbersFromLine(text) {
  // まずはtrimする。
  text = text.trim();
  // 空白文字1文字1以上を区切りとみなす。
  const ws = /\s+/;
  const segments = text.split(ws);

  // それぞれのセグメントに対し、数値への変換を試みる。
  // 失敗した場合はparseIntがErrorを吐く。
  const int_array = segments.map(x => {
    const conv = parseInt(x);
    if (isNaN(conv)) {
      throw new Error("Failed to parse integer.");
    }
    return conv;
  });

  return int_array;

}


/**
 * グラフテキストとフラグから、グラフデータを作成する
 * @returns {object} グラフを表現するオブジェクト
 */
function createGraphData(graph_text, is_directed, index_base) {
  // グラフテキスト（HTMLから引っ張ってきたそのまま）を、行ごとに数値の配列に変換する。
  const num_array = convertGraphTextToNumberArray(graph_text);

  // 最低1行は必要。
  if (num_array.length == 0) {
    throw new Error("There is no line.");
  }

  // 1行目は[nodes_count, edges_count]の形式でなければならない。
  const first_numbers = num_array[0];
  if (first_numbers.length != 2) {
    throw new Error("The first line is invalid.");
  }
  const nodes_count = first_numbers[0];
  const edges_count = first_numbers[1];

  // 2行目からはエッジの定義が要求されるため、全体の行数はedges_count+1でなければならない。
  const rest_lines_count = num_array.length - 1;
  if (rest_lines_count != edges_count) {
    throw new Error("Edge counts and line counts did not match.")
  }

  // 2行目以降がエッジのデータになる。
  const edges_num = num_array.slice(1);

  const edges = edges_num.map(getEdgeData);

  return {
    nodes_count: nodes_count,
    edges_count: edges_count,
    edges: edges,
    directed: is_directed,
    index_base: index_base
  };

}

/**
 * 数値の配列をエッジデータに変換する。
 * @param {Array} nums - numberの配列。"from to weight"の順番。
 * @returns {object} from, to, weightを持つobject。
 */
function getEdgeData(nums) {
  // 各行は[from, to]または[from, to, weight]の形式でなければならない。
  if (nums.length < 2 || nums.length > 3) {
    throw new Error("Invalid edge definition.");
  }
  const from = nums[0];
  const to = nums[1];
  // 辺の重みのデフォルトは1とする。
  let weight = 1;
  if (nums.length == 3) {
    weight = nums[2];
  }

  const g = {
    from: from,
    to: to,
    weight: weight
  };

  return g;
}


function draw() {
  let error_msg = "";
  try {
    // HTMLからテキストやフラグなどのデータを読み込む。
    const dom = new GraphDOMLoader();
    const graphtext = dom.getGraphTextFromHTML();
    const is_directed = dom.getIsDirectedFromHTML();
    const index_base = dom.getIndexBaseFromHTML();

    // HTMLから読み込んだデータを元に、グラフを作成する。
    const graph = createGraphData(graphtext, is_directed, index_base);

    // グラフデータと対象のDOM IDを指定する。
    draw_graph("graph-output", graph);

  }
  catch (error) {
    error_msg = "Error: " + error.message + " ";
  }
  finally {
    const errorbox = document.getElementById("error-output");
    errorbox.textContent = error_msg;
  }
}

function draw_graph(dom_id, graph) {
  const graph_output_id = "#graph-output";



  // エッジのvalidation
  let edge_node_min = Infinity;
  let edge_node_max = -1;
  for (let i = 0; i < graph.edges.length; i++) {
    let s = graph.edges[i].from;
    let t = graph.edges[i].to;
    edge_node_min = Math.min(edge_node_min, s, t);
    edge_node_max = Math.max(edge_node_max, s, t);
  }
  if (edge_node_min < graph.index_base ||
    edge_node_max >= graph.nodes_count + graph.index_base) {
    throw new Error("Some edges' source or destination are invalid");
  }

  // Remove the existing svg
  d3.select(graph_output_id)
    .selectAll("svg")
    .remove();

  // Create a new svg
  const width = 800;
  const height = 800;
  let svg = d3.select(graph_output_id)
    .append("svg")
    .attr("width", width)
    .attr("height", height);


  // Construct node data for d3
  var nodes_data = [];
  for (let i = 0; i < graph.nodes_count; i++) {
    nodes_data.push({
      "index": i,
      "x": width / 2,
      "y": height / 2,
      "r": 30,
    });
  }
  // Construct edge data for d3
  var edges_data = [];
  for (let edge of graph.edges) {
    let src = edge.from - graph.index_base;
    let dst = edge.to - graph.index_base;
    let w = edge.weight;

    edges_data.push({
      "source": src,
      "target": dst,
      "weight": w,
      "x1": nodes_data[src].x,
      "x2": nodes_data[dst].x,
      "y1": nodes_data[src].y,
      "y2": nodes_data[dst].y,
      "l": 30 + nodes_data[src].r
        + nodes_data[dst].r
    })
  }


  let edge = svg
    .selectAll("line")
    .data(edges_data)
    .enter()
    .append("line")
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("x1", d => d.x1)
    .attr("y1", d => d.y1)
    .attr("x2", d => d.x2)
    .attr("y2", d => d.y2);

  let node = svg
    .selectAll("circle")
    .data(nodes_data)
    .enter()
    .append("circle")
    .attr("r", d => d.r)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("fill", "lightyellow")
    .attr("stroke", "black")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  let edge_label = svg
    .append("g")
    .selectAll("text")
    .data(edges_data)
    .enter()
    .append("text")
    .attr("x", d => (d.x1 + d.x2) / 2)
    .attr("y", d => (d.y1 + d.y2) / 2)
    .attr("fill", "black")
    .attr("font-size", 18)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .text(d => d.weight.toString());
  
  let node_label = svg
    .append("g")
    .selectAll("text")
    .data(nodes_data)
    .enter()
    .append("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("fill", "black")
    .attr("font-size", 30)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .text(d => (d.index + graph.index_base).toString());



  let simulation = d3.forceSimulation()
    .force("link",
      d3.forceLink()
        .distance(200)
        .strength(0.1)
        .iterations(16))
    .force("charge", d3.forceManyBody().strength(-60))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide",
      d3.forceCollide()
        .radius(d => d.r)
        .strength(0.7)
        .iterations(16))

  simulation
    .nodes(nodes_data)
    .on("tick", ticked);

  simulation.force("link")
    .links(edges_data)
    .id(d => d.index);

  function ticked() {
    edge
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    node_label
      .attr("x", d => d.x)
      .attr("y", d => d.y);

    edge_label
      .attr("x", d => (d.source.x + d.target.x) / 2)
      .attr("y", d => (d.source.y + d.target.y) / 2);
  }


  function dragstarted(d) {
    if (!d.active)
      simulation.alphaTarget(0.3).restart();

    d.subject.fx = d.x;
    d.subject.fy = d.y;
  }

  function dragged(d) {
    d.subject.fx = d.x;
    d.subject.fy = d.y;
  }

  function dragended(d) {
    if (!d.active)
      simulation.alphaTarget(0);
    d.subject.fx = null;
    d.subject.fy = null;
  }
}


