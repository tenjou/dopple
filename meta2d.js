function x(a) {
	this.b = 10;
	this.b = 2;
}

x.prototype = {
	c: "sdsd"
};

var a = new x(10);