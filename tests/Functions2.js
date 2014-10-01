"use strict";

var x = {
	a: 10 / 2.5,
	b: "Stuff",
	x: function(x) {},
	y: function(x, y, z, w) {}
}

x.func = function() {
	var stuff = "foo" + "bar";
}

function inc(x, y) {}

var inc2 = function(x, y) {}

x.y("Hello", "World", 100);
x.x();
inc();
inc(10, 20);
inc2("sdsd", -12);
x.func();
