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
	cls.addFunc("viewport", 
		[ extern.cachedVars.Number, extern.cachedVars.Number, extern.cachedVars.Number, extern.cachedVars.Number ], null);
	cls.addFunc("clear", [ extern.cachedVars.Number ], null);
	cls.addFunc("clearColor", 
		[ extern.cachedVars.Number, extern.cachedVars.Number, extern.cachedVars.Number, extern.cachedVars.Number ], null);
	cls.addFunc("createShader", [ extern.cachedVars.Number ], extern.vars.WebGLShader);
	cls.addFunc("shaderSource", [ extern.vars.WebGLShader, extern.cachedVars.String ], null);
	cls.addFunc("compileShader", [ extern.vars.WebGLShader ]);
	cls.addFunc("createProgram", null, extern.vars.WebGLProgram);
	cls.addFunc("attachShader", [ extern.vars.WebGLProgram, extern.vars.WebGLShader ], null);
	cls.addFunc("linkProgram", [ extern.vars.WebGLProgram ], null);
	cls.addFunc("useProgram", [ extern.vars.WebGLProgram ], null);
	cls.addFunc("getShaderParameter", [ extern.vars.WebGLShader, extern.cachedVars.Number ], extern.cachedVars.Boolean, true);
	cls.addFunc("getProgramParameter", [ extern.vars.WebGLProgram, extern.cachedVars.Number ], extern.cachedVars.Boolean, true);
	cls.addFunc("getShaderInfoLog", [ extern.vars.WebGLShader ], extern.cachedVars.String);
	cls.addFunc("getProgramInfoLog", [ extern.vars.WebGLProgram ], extern.cachedVars.String);
	cls.addFunc("getUniformLocation", [ extern.vars.WebGLProgram, extern.cachedVars.String ], extern.vars.WebGLUniformLocation);
	cls.addFunc("uniform4fv", [ extern.vars.WebGLUniformLocation, extern.vars.Float32Array ]);
	cls.addFunc("getAttribLocation", [ extern.vars.WebGLProgram, extern.cachedVars.String ], extern.cachedVars.Number, true);
	cls.addFunc("enableVertexAttribArray", [ extern.cachedVars.Number ], null);
	cls.addFunc("vertexAttribPointer", 
		[ extern.cachedVars.Number, extern.cachedVars.Number, extern.cachedVars.Number, 
		extern.cachedVars.Boolean, extern.cachedVars.Number, extern.cachedVars.Number ], null);
	cls.addFunc("drawArrays", [ extern.cachedVars.Number, extern.cachedVars.Number, extern.cachedVars.Number ], null);
	cls.addFunc("createBuffer", null, extern.vars.WebGLBuffer);
	cls.addFunc("bindBuffer", [ extern.cachedVars.Number, extern.vars.WebGLBuffer ], null);
	cls.addFunc("bufferData", [ extern.cachedVars.Number, extern.vars.Float32Array, extern.cachedVars.Number ], null);
	cls.addVar("VERTEX_SHADER", extern.cachedVars.Number);
	cls.addVar("FRAGMENT_SHADER", extern.cachedVars.Number);	
	cls.addVar("COMPILE_STATUS", extern.cachedVars.Number);	
	cls.addVar("LINK_STATUS", extern.cachedVars.Number);	
	cls.addVar("COLOR_BUFFER_BIT", extern.cachedVars.Number);
	cls.addVar("DEPTH_BUFFER_BIT", extern.cachedVars.Number);
	cls.addVar("STENCIL_BUFFER_BIT", extern.cachedVars.Number);
	cls.addVar("ARRAY_BUFFER", extern.cachedVars.Number);
	cls.addVar("STATIC_DRAW", extern.cachedVars.Number);
	cls.addVar("FLOAT", extern.cachedVars.Number);
	cls.addVar("TRIANGLES", extern.cachedVars.Number);
	cls.finish();	
});
