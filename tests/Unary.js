"use strict";

var x = 10;
var y = 20;
x = x++ + --y;
var y = 1 + ++x + 1;

x++;
x--;
--x;
x++;
x--;
--y;
console.log(x++ + 1);

function sum() {
	console.log();
}

sum(x++ + 1 + --y);
console.log(x);