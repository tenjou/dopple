var x = 10;
var y = "str" + x;
 
function concat(x, y) {
	return x + y;
}
 
var result = concat("str1" + x, "str2") + concat("a", "b");
console.log(result, y);