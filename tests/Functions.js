"use strict";

var x = {
	x: function(x) {},
	y: function(x, y, z, w) {}
}

function inc(x, y) {}

var inc2 = function(x, y) {}

x.y("Hello", "World", 100);
x.x();
inc();
inc(10, 20);
inc2("sdsd", -12);