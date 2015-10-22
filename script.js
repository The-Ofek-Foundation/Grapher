var docwidth, docheight;
var precision = 10;
var EXPR = 'x*sin(x)';
var graph, pen;
var domain = [-15, 15];
var range = [-10, 10];
var increment = 0.02;
var line_mode = true;
var previous_trace = false;
var saved_graph = false;
var prev_domain;
var data;

$('#expression').val(EXPR);

function update_dri() { // domain, range, increment
  var str = "Domain: " + domain + " ... Range: " + range + " ... Increment: " + increment;
  $('#upper-footer').text(str);
}

function update_xym(x, y, m) { // x, y, slope
  var str = "X: " + x + " ... Y: " + y + " ... Slope: " + m;
  $('#upper-upper-footer').text(str);
}

update_dri();

function restore_graph() {
  var data = pen.getImageData(0, 0, graph.width, graph.height);
  var pixels = data.data;
  for (var i = 0; i < pixels.length; i++)
    pixels[i] = saved_graph[i];
  pen.putImageData(data, 0, 0, 0, 0, data.width, data.height);
}

function save_graph() {
  var data = pen.getImageData(0, 0, graph.width, graph.height);
  var pixels = data.data;
  saved_graph = new Array(pixels.length);
  for (var i = 0; i < pixels.length; i++)
    saved_graph[i] = pixels[i];
  pen.putImageData(data, 0, 0, 0, 0, data.width, data.height);
}

function evaluate_expression(expr, location) {
  return math.round(math.compile(expr).eval({x: location}), precision);
}

function evaluate_derivative(expr, location) {
  return math.round((evaluate_expression(expr, location + 0.0001) - evaluate_expression(expr, location - 0.0001)) / 0.0002, precision);
}

function get_tangent_expression(expr, location) {
  return evaluate_derivative(expr, location) + '*(x-' + location + ')+' + evaluate_expression(expr, location);
}

function clear_graph() {
  pen.clearRect(0, 0, docwidth, docheight);
  pen.fillStyle = "white";
  pen.fillRect(0, 0, docwidth, docheight);
}

function X(x) { // convert x coord to somewhere on screen
  x = x - domain[0];
  return x * docwidth / (domain[1] - domain[0]);
}

function rX(x) { // convert somewhere on screen to x coord
  x = x / docwidth * (domain[1] - domain[0]);
  return x + domain[0];
}

function Y(y) { // convert y coord to somewhere on screen
  y = y - range[0];
  return docheight - (y * docheight / (range[1] - range[0]));
}

function rY(y) {
  y = docheight - y;
  y = y / docheight * (range[1] - range[0]);
  return y + range[0];
}

function draw_trace(x) {
  var expr = $('#expression').val();
  var y = evaluate_expression(expr, x);
  pen.fillStyle = "black";
  pen.strokeStyle = "black";
  pen.fillRect(X(x)-2, Y(y)-2, 5, 5);
  var tangent = get_tangent_expression(expr, x);
  var slope = evaluate_derivative(tangent, x);
//     var inc = Math.sqrt(10/(Math.pow(evaluate_derivative(tangent, x), 2) + 1));
//   var inc = evaluate_expression("sqrt(10/((" + slope + ")^2+1))", 0);
  pen.beginPath();
  pen.moveTo(X(domain[0]), Y(evaluate_expression(tangent, domain[0])));
  pen.lineTo(X(domain[1]), Y(evaluate_expression(tangent, domain[1])));
  pen.stroke();
  update_xym(x, y, slope);
}

function trace(x) {
  restore_graph();
  draw_trace(x);
  
}

function draw_axes() {
  pen.strokeStyle = "black";
  pen.beginPath();
  pen.lineWidth = 3;
  pen.moveTo(X(0), 0);
  pen.lineTo(X(0), docheight);
  pen.moveTo(0, Y(0));
  pen.lineTo(docwidth, Y(0));
  pen.stroke();
}

function bad_expression(expr) {
  try {
    evaluate_expression(expr, 0);
    return false;
  }
  catch (err) {
    if ((err + '').indexOf("Invalid number") > 0)
      return false;
    return true;
  }
}

function draw_function(expr, no_save, dom) {
  if (!dom)
    dom = domain;
  if (bad_expression(expr)) {
    alert("Bad Expression!");
    return;
  }
  var x, y;
  var drawing = false;
  pen.strokeStyle = "black";
  pen.fillStyle = "black";
  pen.beginPath();
  pen.lineWidth = 1;
  
  if (line_mode) {
    y = evaluate_expression(expr, dom[0]);
    pen.moveTo(X(dom[0]), Y(y));
    for (x = dom[0] + increment; x <= dom[1]; x += increment) {
      y = evaluate_expression(expr, x);
      if (Y(y) > docheight || Y(y) < 0 || y.re) {
        if (drawing) {
          drawing = false;
          pen.lineTo(X(x), Y(y));
          pen.stroke();
        }
        pen.beginPath();
        pen.moveTo(X(x), Y(y));
      }        
      else {
        pen.lineTo(X(x), Y(y));
        drawing = true;
      }
    }
  }
  else for (x = dom[0]; x <= dom[1]; x += increment)
    pen.fillRect(X(x), Y(evaluate_expression(expr, x)), 1, 1);
  pen.stroke();
  if (!no_save)
    save_graph();
}

function draw_graph() {
  clear_graph();
  
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
  
$(document).keydown(function(e) {
  switch (e.which) {
    case 13: // enter
      $('#btn-eval').click();
      break;
  }
}).mousemove(function(e) {
  if ($('#operation').find(":selected").attr('value') == 'trace') {
    trace(rX(e.pageX));
  }
});

$('#operation').change(function() {
  restore_graph();
});
  
$('#btn-eval').click(function() {
  switch ($('#operation').find(":selected").attr('value')) {
    case 'value':
      prompt("Evaluation:", evaluate_expression($('#expression').val(), parseInt(prompt("Enter a value to evaluate: ", '0'), 10)));
      break;
    case 'derivative':
      prompt("Evaluation:", evaluate_derivative($('#expression').val(), parseInt(prompt("Enter a value to evaluate: ", '0'), 10)));
      break;
    case 'graph':
      draw_function($('#expression').val());
      break;
    case 'clear':
      clear_graph();
      draw_axes();
      $('#operation').val('graph');
      break;
  }
});

$('#btn-settings').click(function() {
  var setting = prompt("Enter a setting: ", 'increment');
  switch(setting) {
    case 'increment':
      increment = parseFloat(prompt("Enter an Increment: ", '0.02'));
      break;
    case 'draw lines': case 'show lines':
      line_mode = true;
      break;
    case 'hide lines':
      line_mode = false;
      break;
    case 'domain':
      domain = eval(prompt("Enter a Domain: ", "[-15, 15]"));
      break;
    case 'range':
      range = eval(prompt("Enter a Range: ", "[-10, 10]"));
      break;
  }
  update_dri();
});

$(document).ready(function(){
    $(document).bind('mousewheel', function(e){
        if(e.originalEvent.wheelDelta /120 > 0) {
          domain = [domain[0] / 2, domain[1] / 2];
          range = [range[0] / 2, range[1] / 2];
          increment /= 2;
          update_dri();
          draw_graph();
        }
        else{
          domain = [domain[0] * 2, domain[1] * 2];
          range = [range[0] * 2, range[1] * 2];
          increment *= 2;
          update_dri();
          draw_graph();
        }
    });
});
