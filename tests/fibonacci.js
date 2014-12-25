"use strict";

function fibonacci(n)
{
	var next;
	var first = 0;
	var second = 1;

	for(var c = 0; c <= n; c++) 
	{
		if(c < 2) {
			next = c;
		}
		else 
		{
			next = first + second;
			first = second;
			second = next;
		}
	}

	return next;
}

function fibonacci_recursive(n)
{
	if(n < 2) {
	    return n;
	}

	return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2);
}

var result = fibonacci(10);
var result2 = fibonacci_recursive(10);
console.log("default:", result, "recursive:", result2);
