var x = null;

function init() {
	x = document.getElementById("canvas");
}

init();

// var x = 0;

// function a() {
// 	x = 10;
// }

// a();

// //var canvas = null;
// //var gl = null;

// function init()
// {
// 	canvas = document.getElementById("canvas");
// 	// if(!canvas) {
// 	// 	console.error("no canvas");
// 	// 	return false;
// 	// }	

// 	// gl = canvas.getContext("experimental-webgl");
// 	// if(!gl) {
// 	// 	console.error("no webgl");
// 	// 	return false;
// 	// }	

// 	// var aspect = canvas.width / canvas.height;
// 	// gl.viewport(0, 0, canvas.width, canvas.height);

// 	// var vertexShaderSrc = 
// 	// 	"attribute vec2 position; \
// 	// 	void main() { \
// 	// 		gl_Position = vec4(position, 0, 1); \
// 	// 	}";

// 	// var fragmentShaderSrc = 
// 	// 	"uniform vec4 color; \
// 	// 	void main() { \
// 	// 	  gl_FragColor = color; \
// 	// 	}";

// 	// var vertexShader = gl.createShader(gl.VERTEX_SHADER);
// 	// gl.shaderSource(vertexShader, vertexShaderSrc);
// 	// gl.compileShader(vertexShader);

// 	// var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
// 	// gl.shaderSource(fragmentShader, fragmentShaderSrc);
// 	// gl.compileShader(fragmentShader);

// 	// var program = gl.createProgram();
// 	// gl.attachShader(program, vertexShader);
// 	// gl.attachShader(program, fragmentShader);
// 	// gl.linkProgram(program);
// 	// gl.useProgram(program);

// 	// if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
// 	// 	console.error(gl.getShaderInfoLog(vertexShader));
// 	// 	return false;
// 	// }

// 	// if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
// 	// 	console.error(gl.getShaderInfoLog(fragmentShader));
// 	// 	return false;
// 	// }

// 	// if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
// 	// 	console.error(gl.getProgramInfoLog(program));
// 	// 	return false;
// 	// }	

// 	// return true;
// }

// // function update() 
// // {
// // 	// glClearColor(rand() % 255 / 255.0f, rand() % 255 / 255.0f, rand() % 255 / 255.0f, 1);
// // 	// glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
// // }

// init();
// //update();

