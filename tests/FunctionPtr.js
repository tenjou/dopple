"use strict";

var callback1 = sum;
var callback2 = callback1;

function sum(x, y) { return x; }

callback2(10, "sdsd");