var scope = {
        sum: function(x, y) {
                return x + y;
        }
}
 
console.log(scope.sum(10, 20));
 
var a = {
        x: 10,
        y: "sdsd",
        z: function() {
                console.log("stuff");
        }
};
 
a.g = 2323;
a.w = "sdsd";
 
a.func = function concat(x, y) {
        return x + y;
};
console.log(a.func("str", 10))
 
console.log(a.w);
 
var x = a.x;
var y = a.y;
var z = y + "sds" + a.x;
console.log(x, a.x, a.y, y, z);
 
console.log(a.x);
a.z();