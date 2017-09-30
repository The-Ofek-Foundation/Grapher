var docWidth, docHeight;
var precision = 10;
var EXPR = 'x*sin(x)';
var graph, pen;
var domain = [-15, 15];
var range = [-10, 10];
var lineMode = true;
var previousTrace = false;
var savedGraph = false;
var prevDomain;
var data;
var currX, currTangent;
var animate = true;
var functionsAnimating = 0;
var immediate = typeof(setImmediate) == 'undefined' ? false:true;
var increment = immediate ? 0.002:0.02;
var drawCoordinateAxes = true;

var expressionElem = getElemName('expression');
var upperFooterElem = getElemId('upper-footer');
var upperUpperFooterElem = getElemId('upper-upper-footer');
var headerElem = getElemId('header');
var footerElem = getElemId('footer');
var operationElem = getElemName('operation');
var btnEvalElem = getElemId('btn-eval');
var btnSettingsElem = getElemId('btn-settings');

setInputValue('expression', EXPR);

function updateDri() { // domain, range, increment
	var str = "Domain: " + domain + " ... Range: " + range + " ... Increment: " + increment;
	upperFooterElem.innerHTML = str;
}

function updateXym(x, y, m) { // x, y, slope
	var str = "X: " + x + " ... Y: " + y + " ... Slope: " + m;
	upperUpperFooterElem.innerHTML = str;
}

updateDri();

function restoreGraph() {
	var data = pen.getImageData(0, 0, graph.width, graph.height);
	var pixels = data.data;
	for (var i = 0; i < pixels.length; i++)
		pixels[i] = savedGraph[i];
	pen.putImageData(data, 0, 0, 0, 0, data.width, data.height);
}

function saveGraph() {
	var data = pen.getImageData(0, 0, graph.width, graph.height);
	var pixels = data.data;
	savedGraph = new Array(pixels.length);
	for (var i = 0; i < pixels.length; i++)
		savedGraph[i] = pixels[i];
	pen.putImageData(data, 0, 0, 0, 0, data.width, data.height);
}

function evaluateExpression(expr, location) {
	return math.round(math.compile(expr).eval({x: location}), precision);
}

function evaluateExpressionExact(expr, location) {
	return math.compile(expr).eval({x: location});
}

function evaluateDerivative(expr, location) {
	return math.round((evaluateExpressionExact(expr, location + 0.0001) - evaluateExpressionExact(expr, location - 0.0001)) / 0.0002, precision);
}

function evaluateNthDerivative(expr, location, n) {
	if (n == 1)
		return evaluateDerivative(expr, location);
	else if (n < 1)
		return null;
	return math.round((evaluateNthDerivative(expr, location + 0.0001, n-1) - evaluateNthDerivative(expr, location - 0.0001, n-1)) / 0.0002, precision);
}

function evaluateIntegral(expr, start, end) {
	return math.round((evaluateExpressionExact(expr, start) + evaluateExpressionExact(expr, end)) / 2 * (end-start), precision);
}

function evaluateIntegralPoint(expr, location) {
	return math.round((evaluateExpressionExact(expr, 0) + evaluateExpressionExact(expr, location)) / 2 * (location-0), precision);
}

function evaluateZero(expr, location) {
	var slope = evaluateDerivative(expr, location);
	return evaluateExpression("(" + slope + "*" + location + "-" + evaluateExpression(expr, location) + ")/" + slope, location);
}

function getTangentExpression(expr, location) {
	return evaluateDerivative(expr, location) + '*(x-' + location + ')+' + evaluateExpression(expr, location);
}

function clearGraph(callback) {
	stopTimeout = true;
	pen.clearRect(0, 0, docWidth, docHeight);
	pen.fillStyle = "white";
	pen.fillRect(0, 0, docWidth, docHeight);
	setTimeout(function() {
		stopTimeout = false;
		functionsAnimating = 0;
		saveGraph();
		callback();
	}, 20);
}

function X(x) { // convert x coord to somewhere on screen
	x = x - domain[0];
	return x * docWidth / (domain[1] - domain[0]);
}

function rX(x) { // convert somewhere on screen to x coord
	x = x / docWidth * (domain[1] - domain[0]);
	return x + domain[0];
}

function Y(y) { // convert y coord to somewhere on screen
	y = y - range[0];
	return docHeight - (y * docHeight / (range[1] - range[0]));
}

function rY(y) {
	y = docHeight - y;
	y = y / docHeight * (range[1] - range[0]);
	return y + range[0];
}

function drawTrace(x) {
	var expr = getInputValue('expression');
	var y = evaluateExpression(expr, x);
	pen.fillStyle = "black";
	pen.strokeStyle = "black";
	pen.fillRect(X(x)-2, Y(y)-2, 5, 5);
	currTangent = getTangentExpression(expr, x);
	var slope = evaluateDerivative(currTangent, x);
//		 var inc = Math.sqrt(10/(Math.pow(evaluateDerivative(tangent, x), 2) + 1));
//	 var inc = evaluateExpression("sqrt(10/((" + slope + ")^2+1))", 0);
	pen.beginPath();
	pen.moveTo(X(domain[0]), Y(evaluateExpression(currTangent, domain[0])));
	pen.lineTo(X(domain[1]), Y(evaluateExpression(currTangent, domain[1])));
	pen.stroke();
	updateXym(x, y, slope);
}

function trace(x) {
	restoreGraph();
	drawTrace(x);
}

function runNewtons() {
	currX = evaluateZero(getInputValue('expression'), currX);
	drawTrace(currX);
}

function drawAxes() {
	pen.strokeStyle = "black";
	pen.beginPath();
	pen.lineWidth = 3;
	pen.moveTo(X(0), 0);
	pen.lineTo(X(0), docHeight);
	pen.moveTo(0, Y(0));
	pen.lineTo(docWidth, Y(0));
	pen.stroke();
}

function badExpression(expr) {
	try {
		evaluateExpression(expr, 0);
		return false;
	}
	catch (err) {
		if ((err + '').indexOf("Invalid number") > 0)
			return false;
		return true;
	}
}

function drawFunction(expr, noSave, dom, deriv) {
	if (animate) {
		startFunctionAnimation(expr, noSave, dom, deriv);
		return;
	}
	if (!dom)
		dom = domain;
	if (badExpression(expr)) {
		alert("Bad Expression!");
		return;
	}
	var x, y;
	var drawing = false;
	var evaluate = deriv ? evaluateDerivative:evaluateExpression;
	pen.strokeStyle = "black";
	pen.fillStyle = "black";
	pen.beginPath();
	pen.lineWidth = 1;

	if (lineMode) {
		y = evaluate(expr, dom[0]);
		pen.moveTo(X(dom[0]), Y(y));
		for (x = dom[0] + increment; x <= dom[1]; x += increment) {
			y = evaluate(expr, x);
			if (Y(y) > docHeight || Y(y) < 0 || y.re) {
				if (drawing) {
					drawing = false;
					pen.lineTo(X(x), Y(y));
					pen.stroke();
				}
				pen.beginPath();
				pen.moveTo(X(x), Y(y));
			} else {
				pen.lineTo(X(x), Y(y));
				drawing = true;
			}
		}
	} else for (x = dom[0]; x <= dom[1]; x += increment)
		pen.fillRect(X(x), Y(evaluate(expr, x)), 1, 1);
	pen.stroke();
	if (!noSave)
		saveGraph();
}

var requestAnimationFrame = immediate ?
	function(callback) {
		return setImmediate(callback);
	}:function(callback) {
		return setTimeout(callback, 0);
	};

var stopTimeout = false;

var animateFunctionDrawing = function(expr, dom, x, prevY, drawing, noSave, evaluate) {
	if (x > dom[1]) {
		if (!noSave)
			saveGraph();
		functionsAnimating--;
		return;
	}

	var y = evaluate(expr, x);

	if (y.re || stopTimeout) drawing = false;
	else if (lineMode) {
		if (Y(y) > docHeight || Y(y) < 0) {
			if (drawing) {
				drawing = false;
				pen.beginPath();
				pen.moveTo(X(x - increment), Y(prevY));
				pen.lineTo(X(x), Y(y));
				pen.stroke();
			}
		} else if (!prevY.re) {
			pen.beginPath();
			pen.moveTo(X(x - increment), Y(prevY));
			pen.lineTo(X(x), Y(y));
			pen.stroke();
			drawing = true;
		}
	} else pen.fillRect(X(x), Y(y), 1, 1);

	if (!stopTimeout)
		requestAnimationFrame(function() {
			animateFunctionDrawing(expr, dom, x + increment, y, drawing, noSave, evaluate);
		});
};

function startFunctionAnimation(expr, noSave, dom, deriv) {
	if (!dom)
		dom = domain;
	if (badExpression(expr)) {
		alert("Bad Expression!");
		return;
	}

	pen.strokeStyle = "black";
	pen.fillStyle = "black";

	pen.lineWidth = 1;
	var evaluate = deriv ? evaluateDerivative:evaluateExpression;

	var y = evaluate(expr, dom[0]);

	functionsAnimating++;
	if (lineMode)
		animateFunctionDrawing(expr, dom, dom[0] + increment, y, false, noSave, evaluate);
	else {
		pen.fillRect(X(dom[0]), Y(y), 1, 1);
		animateFunctionDrawing(expr, dom, dom[0] + increment, y, false, noSave, evaluate);
	}

}

function drawGraph(derivative) {
	clearGraph(function() {
		drawFunction(getInputValue('expression'), null, null, derivative);
	});

	if (drawCoordinateAxes)
	drawAxes();
}

function pageReady() {
	graph = getElemId("graph");
	pen = graph.getContext("2d");

	document.addEventListener('wheel', function(e) {
		if (e.wheelDelta / 120 > 0)
			zoomIn();
		else zoomOut();
	});

	resizeGraph();

	setTimeout(drawGraph, 100);
}

function onResize() {
	resizeGraph();
	drawGraph();
}

function resizeGraph() {
	docWidth = getElemWidth(contentWrapper);
	docHeight = getElemHeight(contentWrapper);

	setElemStyle(headerElem, 'top', contentWrapper.offsetTop);
	setElemStyle(upperFooterElem, 'bottom', getElemHeight(footerElem) + 'px');
	setElemStyle(upperUpperFooterElem, 'bottom', getElemHeight(footerElem) +
		getElemHeight(upperFooterElem) + 'px');

	graph.setAttribute('width', docWidth);
	graph.setAttribute('height', docHeight);
}
document.addEventListener('keydown', function (e) {
	switch (e.which) {
		case 13: // enter
			btnEvalClick();
			break;
		case 78: // n
			if (operationElem.value === 'trace')
				runNewtons();
			break;
	}
	if (e.ctrlKey) {
		switch (e.which) {
			case 187: // =
				e.preventDefault();
				zoomIn();
				break;
			case 189: // -
				e.preventDefault();
				zoomOut();
				break;
		}
	}
});

document.addEventListener('mousemove', function (e) {
	currX = rX(e.pageX);
	if (operationElem.value === 'trace' && functionsAnimating <= 0)
		trace(currX);
});

operationElem.addEventListener('change', function () {
	if (functionsAnimating <= 0)
		restoreGraph();
});

function btnEvalClick() {
	switch (operationElem.value) {
		case 'value':
			prompt("Evaluation:", evaluateExpression(getExpression(),
				parseInt(prompt("Enter a value to evaluate: ", '0'), 10)));
			break;
		case 'derivative':
			prompt("Evaluation:", evaluateDerivative(getExpression(),
				parseInt(prompt("Enter a value to evaluate: ", '0'), 10)));
			break;
		case 'graph':
			drawFunction(getExpression());
			break;
		case 'regraph':
			drawGraph();
			break;
		case 'draw-deriv':
			drawFunction(getExpression(), null, null, true);
			break;
		case 'clear':
			clearGraph(function () {
				if (drawCoordinateAxes)
					drawAxes();
				operationElem.value = 'graph';
			});
			break;
	}
}

function getExpression() {
	return expressionElem.value;
}

btnSettingsElem.addEventListener('click', function () {
	var setting = prompt("Enter a setting: ", 'increment');
	switch(setting) {
		case 'increment':
			increment = parseFloat(prompt("Enter an Increment: ", '0.02'));
			break;
		case 'draw lines': case 'show lines':
			lineMode = true;
			break;
		case 'hide lines':
			lineMode = false;
			break;
		case 'domain':
			domain = eval(prompt("Enter a Domain: ", "[-15, 15]"));
			break;
		case 'range':
			range = eval(prompt("Enter a Range: ", "[-10, 10]"));
			break;
		case 'animate': case 'draw animation':
			animate = true;
			break;
		case 'no animation': case 'stop animation': case 'stop animating':
			animate = false;
			break;
		case 'toggle axes':
			drawCoordinateAxes = !drawCoordinateAxes;
			break;
	}
	updateDri();
});

function zoomIn() {
	var delta = domain[1] - domain[0];
	domain = [domain[0] + delta / 4, domain[1] - delta / 4];
	delta = range[1] - range[0];
	range = [range[0] + delta / 4, range[1] - delta / 4];
	increment /= 2;
	updateDri();
	drawGraph();
}

function zoomOut() {
	var delta = domain[1] - domain[0];
	domain = [domain[0] - delta / 2, domain[1]	+ delta / 2];
	delta = range[1] - range[0];
	range = [range[0] - delta / 2, range[1] + delta / 2];
	increment *= 2;
	updateDri();
	drawGraph();
}
