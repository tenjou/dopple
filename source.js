// var canvas = window;

// function init()
// {
// 	canvas = document.getElementById("canvas");
// }

// init();

// var x = [ 10 ];
// var y = x.push("sdsd");

// var x = 10;
// var y = 4;
// x = y;
// x = "sdsd";

// var x = [ "sdsds" ];
// console.log(x[0], false);

// var index = 0;
// var x = [];
// var y = x[0];
// x = [ 10 ];
// var z = [[ "sdsd" ]];
// var w = z[index];
// var g = w[0];

// var x = new Array();
// var y = x[0];
// x = [ 10 ];

// var x = 20;
// // var array = [ [ 10, x ], [ 10 ] ];

// // var array = new Array(new Array(40, 30));

// // array = new Array(null, null)
// // array = new Array(10);
// // var array2 = [[ 10, 3 ]];
// // var array = new Array([ 10, 3 ]);
// //var array = new Array();
// var array = { x: {} };
// // //array.push("sdsds");
// // // var x = array.pop();
// var y = array[1];

// // var array = [];
// // array = new Array();
// // array = new Array();
// // array = [[ 20 ]];

// //var canvas = null;
// // var gl = null;
// // var image = null;
// // var aspect = 0;
// // var foobar = 0.5;
// // var program;

// //var array = new Float32Array([ 1 ]);

// 	// var vertices = new Float32Array();

// // function init() 
// // {
// // 	canvas = document.getElementById("canvas");
// // 	if(!canvas) {
// // 		console.error("no canvas");
// // 		return false;
// // 	}
// // 	canvas.width = 800;
// // 	canvas.height = 600;

// // 	gl = canvas.getContext("experimental-webgl");
// // 	if(!gl) {
// // 		console.error("no webgl");
// // 		return false;
// // 	}
// // 	gl.viewport(0, 0, canvas.width, canvas.height);

// // 	aspect = canvas.width / canvas.height;

// // 	var vertexShaderSrc = 
// // 		"attribute vec2 position; \
// // 		void main() { \
// // 			gl_Position = vec4(position, 0, 1); \
// // 		}";

// // 	var fragmentShaderSrc = 
// // 		"precision mediump float; uniform vec4 color; \
// // 		void main() { \
// // 		  gl_FragColor = color; \
// // 		}";	

// // 	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
// // 	gl.shaderSource(vertexShader, vertexShaderSrc);
// // 	gl.compileShader(vertexShader);

// // 	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
// // 	gl.shaderSource(fragmentShader, fragmentShaderSrc);
// // 	gl.compileShader(fragmentShader);	

// // 	program = gl.createProgram();
// // 	gl.attachShader(program, vertexShader);
// // 	gl.attachShader(program, fragmentShader);
// // 	gl.linkProgram(program);
// // 	gl.useProgram(program);	

// // 	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
// // 		console.error(gl.getShaderInfoLog(vertexShader));
// // 		return false;
// // 	}

// // 	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
// // 		console.error(gl.getShaderInfoLog(fragmentShader));
// // 		return false;
// // 	}

// // 	if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
// // 		console.error(gl.getProgramInfoLog(program));
// // 		return false;
// // 	}		

// // 	return true;	
// // }

// // function loadImages()
// // {
// // 	image = new Image();
// // 	image.onload = function() {
// // 		console.log(image.src);
// // 	};
// // 	image.src = "assets/cubetexture.png";	
// // }

// // function update() 
// // {
// // 	var vertices = new Float32Array([
// // 			-foobar, foobar * aspect,
// // 			foobar, foobar * aspect,
// // 			foobar, -foobar * aspect
// // 		]);

// // 	gl.clearColor(0.9, 0.9, 0.9, 1.0);
// // 	gl.clear(gl.COLOR_BUFFER_BIT);

// // 	window.requestAnimationFrame(update);
// // }

// // if(init()) {
// // 	update();
// // }

// // var canvas = null;
// // var gl = null;
// // var foobar = 0.5;
// // var aspect;
// // var program;
// // var itemSize = 2;
// // var adding = true;

// // function init()
// // {
// // 	canvas = document.getElementById("canvas");
// // 	if(!canvas) {
// // 		console.error("no canvas");
// // 		return false;
// // 	}	

// // 	gl = canvas.getContext("experimental-webgl");
// // 	if(!gl) {
// // 		console.error("no webgl");
// // 		return false;
// // 	}	

// // 	aspect = canvas.width / canvas.height;
// // 	gl.viewport(0, 0, canvas.width, canvas.height);

// // 	var vertexShaderSrc = 
// // 		"attribute vec2 position; \
// // 		void main() { \
// // 			gl_Position = vec4(position, 0, 1); \
// // 		}";

// // 	var fragmentShaderSrc = 
// // 		"precision mediump float; uniform vec4 color; \
// // 		void main() { \
// // 		  gl_FragColor = color; \
// // 		}";

// // 	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
// // 	gl.shaderSource(vertexShader, vertexShaderSrc);
// // 	gl.compileShader(vertexShader);

// // 	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
// // 	gl.shaderSource(fragmentShader, fragmentShaderSrc);
// // 	gl.compileShader(fragmentShader);

// // 	program = gl.createProgram();
// // 	gl.attachShader(program, vertexShader);
// // 	gl.attachShader(program, fragmentShader);
// // 	gl.linkProgram(program);
// // 	gl.useProgram(program);

// // 	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
// // 		console.error(gl.getShaderInfoLog(vertexShader));
// // 		return false;
// // 	}

// // 	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
// // 		console.error(gl.getShaderInfoLog(fragmentShader));
// // 		return false;
// // 	}

// // 	if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
// // 		console.error(gl.getProgramInfoLog(program));
// // 		return false;
// // 	}	

// // 	return true;
// // }

// // function update() 
// // {
// // 	var vertices = new Float32Array([
// // 			-foobar, foobar * aspect,
// // 			foobar, foobar * aspect,
// // 			foobar, -foobar * aspect
// // 		]);

// // 	gl.clearColor(0.9, 0.9, 0.9, 1);
// // 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

// // 	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
// // 	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// // 	var uniformColor = gl.getUniformLocation(program, "color");
// // 	gl.uniform4fv(uniformColor, new Float32Array([ foobar, 0, 0, 1 ]))

// // 	var attribPos = gl.getAttribLocation(program, "position");
// // 	gl.enableVertexAttribArray(attribPos);
// // 	gl.vertexAttribPointer(attribPos, itemSize, gl.FLOAT, false, 0, 0);

// // 	gl.drawArrays(gl.TRIANGLES, 0, 3);

// // 	foobar += (adding ? 1 : -1) * foobar / 100;

// // 	if(foobar > 0.5) {
// // 		adding = false;
// // 	}
// // 	else if(foobar < 0.2) {
// // 		adding = true;
// // 	}

// // 	window.requestAnimationFrame(update);
// // }

// // if(init()) {
// // 	update();
// // }
