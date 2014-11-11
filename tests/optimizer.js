"use strict";

var x = 10;
var a = x + 2 + (2 + 1) * -0.5 + x * 1 / 3 * 4 + 2.5 + 1;
var b = x + 2 + (2 + 1) * -0.5 + "aaa" + 1 / 3 * 4 + 2.5 + 1;

console.log(a, b);