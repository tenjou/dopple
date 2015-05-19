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

	extern.cachedVars.WebGLShader = extern.create(extern.vars.WebGLShader);
	extern.cachedVars.WebGLProgram = extern.create(extern.vars.WebGLProgram);
	extern.cachedVars.WebGLBuffer = extern.create(extern.vars.WebGLBuffer);
	extern.cachedVars.WebGLUniformLocation = extern.create(extern.vars.WebGLUniformLocation);

	cls = extern.addClass("WebGLRenderingContext");
	cls.addFunc("viewport", 
		[ extern.cachedVars.Real64, extern.cachedVars.Real64, extern.cachedVars.Real64, extern.cachedVars.Real64 ], null);
	cls.addFunc("clear", [ extern.cachedVars.Real64 ], null);
	cls.addFunc("clearColor", 
		[ extern.cachedVars.Real64, extern.cachedVars.Real64, extern.cachedVars.Real64, extern.cachedVars.Real64 ], null);
	cls.addFunc("createShader", [ extern.cachedVars.Real64 ], extern.cachedVars.WebGLShader);
	cls.addFunc("shaderSource", [ extern.cachedVars.WebGLShader, extern.cachedVars.String ], null);
	cls.addFunc("compileShader", [ extern.cachedVars.WebGLShader ]);
	cls.addFunc("createProgram", null, extern.cachedVars.WebGLProgram);
	cls.addFunc("attachShader", [ extern.cachedVars.WebGLProgram, extern.cachedVars.WebGLShader ], null);
	cls.addFunc("linkProgram", [ extern.cachedVars.WebGLProgram ], null);
	cls.addFunc("useProgram", [ extern.cachedVars.WebGLProgram ], null);
	cls.addFunc("getShaderParameter", [ extern.cachedVars.WebGLShader, extern.cachedVars.Real64 ], extern.cachedVars.Boolean, true);
	cls.addFunc("getProgramParameter", [ extern.cachedVars.WebGLProgram, extern.cachedVars.Real64 ], extern.cachedVars.Boolean, true);
	cls.addFunc("getShaderInfoLog", [ extern.cachedVars.WebGLShader ], extern.cachedVars.String);
	cls.addFunc("getProgramInfoLog", [ extern.cachedVars.WebGLProgram ], extern.cachedVars.String);
	cls.addFunc("getUniformLocation", [ extern.cachedVars.WebGLProgram, extern.cachedVars.String ], extern.cachedVars.WebGLUniformLocation);
	cls.addFunc("uniform4fv", [ extern.cachedVars.WebGLUniformLocation, extern.cachedVars.Float32Array ]);
	cls.addFunc("getAttribLocation", [ extern.cachedVars.WebGLProgram, extern.cachedVars.String ], extern.nativeVars.Real64, true);
	cls.addFunc("enableVertexAttribArray", [ extern.cachedVars.Real64 ], null);
	cls.addFunc("vertexAttribPointer", 
		[ extern.cachedVars.Real64, extern.cachedVars.Real64, extern.cachedVars.Real64, 
		extern.cachedVars.Bool, extern.cachedVars.Real64, extern.cachedVars.Real64 ], null);
	cls.addFunc("drawArrays", [ extern.cachedVars.Real64, extern.cachedVars.Real64, extern.cachedVars.Real64 ], null);
	cls.addFunc("createBuffer", null, extern.cachedVars.WebGLBuffer);
	cls.addFunc("bindBuffer", [ extern.cachedVars.Real64, extern.cachedVars.WebGLBuffer ], null);
	cls.addFunc("bufferData", [ extern.cachedVars.Real64, extern.cachedVars.Float32Array, extern.cachedVars.Real64 ], null);
	cls.addVar("VERTEX_SHADER", extern.cachedVars.Real64);
	cls.addVar("FRAGMENT_SHADER", extern.cachedVars.Real64);	
	cls.addVar("COMPILE_STATUS", extern.cachedVars.Real64);	
	cls.addVar("LINK_STATUS", extern.cachedVars.Real64);	
	cls.addVar("COLOR_BUFFER_BIT", extern.cachedVars.Real64);
	cls.addVar("DEPTH_BUFFER_BIT", extern.cachedVars.Real64);
	cls.addVar("STENCIL_BUFFER_BIT", extern.cachedVars.Real64);
	cls.addVar("ARRAY_BUFFER", extern.cachedVars.Real64);
	cls.addVar("STATIC_DRAW", extern.cachedVars.Real64);
	cls.addVar("FLOAT", extern.cachedVars.Real64);
	cls.addVar("TRIANGLES", extern.cachedVars.Real64);
	cls.finish();	
});
