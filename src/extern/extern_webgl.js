"use strict";

dopple.extern("webgl", function(extern) 
{
	var cls = extern.addClass("WebGLShader");
	cls.finish();	

	cls = extern.addClass("WebGLProgram");
	cls.finish();	

	cls = extern.addClass("WebGLBuffer");
	cls.finish();

	cls = extern.addClass("WebGLUniformLocation");
	cls.finish();		

	cls = extern.addClass("WebGLRenderingContext");
	cls.addFunc("viewport", [ vars.Number, vars.Number, vars.Number, vars.Number ], null);
	cls.addFunc("clear", [ vars.Number ], null);
	cls.addFunc("clearColor", [ vars.Number, vars.Number, vars.Number, vars.Number ], null);
	cls.addFunc("createShader", [ vars.Number ], vars.WebGLShader);
	cls.addFunc("shaderSource", [ vars.WebGLShader, vars.String ], null);
	cls.addFunc("compileShader", [ vars.WebGLShader ]);
	cls.addFunc("createProgram", null, vars.WebGLProgram);
	cls.addFunc("attachShader", [ vars.WebGLProgram, vars.WebGLShader ], null);
	cls.addFunc("linkProgram", [ vars.WebGLProgram ], null);
	cls.addFunc("useProgram", [ vars.WebGLProgram ], null);
	cls.addFunc("getShaderParameter", [ vars.WebGLShader, vars.Number ], vars.Boolean, true);
	cls.addFunc("getProgramParameter", [ vars.WebGLProgram, vars.Number ], vars.Boolean, true);
	cls.addFunc("getShaderInfoLog", [ vars.WebGLShader ], vars.String);
	cls.addFunc("getProgramInfoLog", [ vars.WebGLProgram ], vars.String);
	cls.addFunc("getUniformLocation", [ vars.WebGLProgram, vars.String ], vars.WebGLUniformLocation);
	cls.addFunc("uniform4fv", [ vars.WebGLUniformLocation, vars.Float32Array ]);
	cls.addFunc("getAttribLocation", [ vars.WebGLProgram, vars.String ], vars.Number, true);
	cls.addFunc("enableVertexAttribArray", [ vars.Number ], null);
	cls.addFunc("vertexAttribPointer", [ vars.Number, vars.Number, vars.Number, vars.Boolean, vars.Number, vars.Number ], null);
	cls.addFunc("drawArrays", [ vars.Number, vars.Number, vars.Number ], null);
	cls.addFunc("createBuffer", null, vars.WebGLBuffer);
	cls.addFunc("bindBuffer", [ vars.Number, vars.WebGLBuffer ], null);
	cls.addFunc("bufferData", [ vars.Number, vars.Float32Array, vars.Number ], null);
	cls.addVar("VERTEX_SHADER", vars.Number);
	cls.addVar("FRAGMENT_SHADER", vars.Number);	
	cls.addVar("COMPILE_STATUS", vars.Number);	
	cls.addVar("LINK_STATUS", vars.Number);	
	cls.addVar("COLOR_BUFFER_BIT", vars.Number);
	cls.addVar("DEPTH_BUFFER_BIT", vars.Number);
	cls.addVar("STENCIL_BUFFER_BIT", vars.Number);
	cls.addVar("ARRAY_BUFFER", vars.Number);
	cls.addVar("STATIC_DRAW", vars.Number);
	cls.addVar("FLOAT", vars.Number);
	cls.addVar("TRIANGLES", vars.Number);
	cls.finish();	
});
