"use strict";

function fibonacci_recursive(n)
{
	if(n < 2) {
	    return n;
	}

	return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2);
}
 
var result = fibonacci_recursive(6);
console.log(result);