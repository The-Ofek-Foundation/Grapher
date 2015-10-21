var docwidth, docheight;
var precision = 10;
var EXPR = 'x*sin(x)';
var graph, pen;
var domain = [-15, 15];
var range = [-10, 10];
var increment = 0.05;

$('#expression').val(EXPR);

function evaluate_expression(expr, location) {
  return math.round(math.compile(expr).eval({x: location}), precision);
}

function clear_graph() {
  pen.clearRect(0, 0, docwidth, docheight);
}

function X(x) { // convert x coord to somewhere on screen
  x = x - domain[0];
  return x * docwidth / (domain[1] - domain[0]);
}

function Y(y) { // convert y coord to somewhere on screen
  y = y - range[0];
  return docheight - (y * docheight / (range[1] - range[0]));
}

function draw_axes() {
  pen.strokeStyle = "black";
  pen.beginPath();
  pen.lineWidth = 1;
  pen.moveTo(X(0), 0);
  pen.lineTo(X(0), docheight);
  pen.moveTo(0, Y(0));
  pen.lineTo(docwidth, Y(0));
  pen.stroke();
}

function draw_function(expr) {
  pen.strokeStyle = "black";
  pen.beginPath();
  pen.lineWidth = 1;
  pen.moveTo(X(domain[0]), Y(evaluate_expression(expr, domain[0])));
  for (var x = domain[0] + increment; x <= domain[1]; x += increment) {
    pen.lineTo(X(x), Y(evaluate_expression(expr, x)));
  }
  pen.stroke();
}

function draw_graph() {
  draw_axes();
  
  draw_function($('#expression').val());
}

$(document).ready(function() {
  
  graph = document.getElementById("graph");
  pen = graph.getContext("2d");
  
  docwidth = $(document).outerWidth(true);
  docheight = $(document).outerHeight(true);
  
  graph.setAttribute('width', docwidth);
  graph.setAttribute('height', docheight);
  
  draw_graph();
  
});
  
$('#btn-eval').click(function() {
  switch ($('#operation').find(":selected").attr('value')) {
    case 'value':
      prompt("Evaluation:", evaluate_expression($('#expression').val(), prompt("Enter a value to evaluate: ")));
      break;
    case 'graph':
      draw_function($('#expression').val());
      break;
    case 'clear':
      clear_graph();
      draw_axes();
      break;
  }
});
