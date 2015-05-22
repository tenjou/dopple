"use strict";

dopple.extern("webgl", function(extern) 
{
	var externCls = extern.addClass("WebGLShader");
	externCls.cls.alt = "GLuint";
	externCls.cls.flags |= dopple.Flag.MEMORY_STACK;
	externCls.finish();	
	extern.cachedVars.WebGLShader = extern.create(extern.vars.WebGLShader);

	externCls = extern.addClass("WebGLProgram");
	externCls.cls.alt = "GLuint";
	externCls.cls.flags |= dopple.Flag.MEMORY_STACK;
	externCls.finish();	
	extern.cachedVars.WebGLProgram = extern.create(extern.vars.WebGLProgram);

	externCls = extern.addClass("WebGLBuffer");
	externCls.cls.alt = "GLuint";
	externCls.cls.flags |= dopple.Flag.MEMORY_STACK;
	externCls.finish();
	extern.cachedVars.WebGLBuffer = extern.create(extern.vars.WebGLBuffer);

	externCls = extern.addClass("WebGLUniformLocation");
	externCls.cls.alt = "GLuint";
	externCls.cls.flags |= dopple.Flag.MEMORY_STACK;
	externCls.finish();		
	extern.cachedVars.WebGLUniformLocation = extern.create(extern.vars.WebGLUniformLocation);

	var genericGlHook = function(name) {
		return "gl" + name[0].toUpperCase() + name.substr(1);
	};

	var cls = extern.addClass("WebGLRenderingContext");

	cls.addFunc("activeTexture", [ extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("attachShader", [ extern.cachedVars.WebGLProgram, extern.cachedVars.WebGLShader ], null).hook = genericGlHook;
	cls.addFunc("bindAttribLocation", [ extern.cachedVars.WebGLProgram, extern.cachedVars.Real64, 
		extern.cachedVars.String ], null).hook = genericGlHook;
	cls.addFunc("bindBuffer", [ extern.cachedVars.Real64, extern.cachedVars.WebGLBuffer ], null).hook = genericGlHook;
	cls.addFunc("bindFramebuffer", [ extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("bindRenderbuffer", [ extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("bindTexture", [ extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("blendColor", [ extern.cachedVars.Real64, extern.cachedVars.Real64, 
		extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("blendEquation", [ extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("blendEquationSeparate", [ extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("blendFunc", [ extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("blendFuncSeparate", [ extern.cachedVars.Real64, extern.cachedVars.Real64,
		extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("bufferData", [ extern.cachedVars.Real64, extern.cachedVars.Float32Array, extern.cachedVars.Real64 ], null);
	cls.addFunc("bufferSubData", [ extern.cachedVars.Real64, extern.cachedVars.Real64, 
		extern.cachedVars.Float32Array ], null);
	cls.addFunc("clear", [ extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("clearColor", 
		[ extern.cachedVars.Real64, extern.cachedVars.Real64, 
		  extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;
	cls.addFunc("clearDepth", [ extern.cachedVars.Real64 ], null).hook = genericGlHook; 
	cls.addFunc("clearStencil", [ extern.cachedVars.Real64 ], null).hook = genericGlHook; 
	cls.addFunc("colorMask", [ extern.cachedVars.Bool, extern.cachedVars.Bool, 
		extern.cachedVars.Bool, extern.cachedVars.Bool ], null).hook = genericGlHook; 
	cls.addFunc("compileShader", [ extern.cachedVars.WebGLShader ]).hook = genericGlHook;
	


	cls.addFunc("createShader", [ extern.cachedVars.Real64 ], extern.cachedVars.WebGLShader).hook = genericGlHook;
	cls.addFunc("shaderSource", [ extern.cachedVars.WebGLShader, extern.cachedVars.String ], null);
	

	cls.addFunc("createProgram", null, extern.cachedVars.WebGLProgram).hook = genericGlHook;
	
	cls.addFunc("linkProgram", [ extern.cachedVars.WebGLProgram ], null).hook = genericGlHook;
	cls.addFunc("useProgram", [ extern.cachedVars.WebGLProgram ], null).hook = genericGlHook;
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

	cls.addFunc("viewport", 
		[ extern.cachedVars.Real64, extern.cachedVars.Real64, 
		  extern.cachedVars.Real64, extern.cachedVars.Real64 ], null).hook = genericGlHook;	

	var glesEnums = [ 
		"DEPTH_BUFFER_BIT",
		"STENCIL_BUFFER_BIT",
		"COLOR_BUFFER_BIT",
		"FALSE",
		"TRUE",
		"POINTS",
		"LINES",
		"LINE_LOOP",
		"LINE_STRIP",
		"TRIANGLES",
		"TRIANGLE_STRIP",
		"TRIANGLE_FAN",
		"ZERO",
		"ONE",
		"SRC_COLOR",
		"ONE_MINUS_SRC_COLOR",
		"SRC_ALPHA",
		"ONE_MINUS_SRC_ALPHA",
		"DST_ALPHA",
		"ONE_MINUS_DST_ALPHA",
		"DST_COLOR",
		"ONE_MINUS_DST_COLOR",
		"SRC_ALPHA_SATURATE",
		"FUNC_ADD",
		"BLEND_EQUATION",
		"BLEND_EQUATION_RGB",
		"BLEND_EQUATION_ALPHA",
		"FUNC_SUBTRACT",
		"FUNC_REVERSE_SUBTRACT",
		"BLEND_DST_RGB",
		"BLEND_SRC_RGB",
		"BLEND_DST_ALPHA",
		"BLEND_SRC_ALPHA",
		"CONSTANT_COLOR",
		"ONE_MINUS_CONSTANT_COLOR",
		"CONSTANT_ALPHA",
		"ONE_MINUS_CONSTANT_ALPHA",
		"BLEND_COLOR",
		"ARRAY_BUFFER",
		"ELEMENT_ARRAY_BUFFER",
		"ARRAY_BUFFER_BINDING",
		"ELEMENT_ARRAY_BUFFER_BINDING",
		"STREAM_DRAW",
		"STATIC_DRAW",
		"DYNAMIC_DRAW",
		"BUFFER_SIZE",
		"BUFFER_USAGE",
		"CURRENT_VERTEX_ATTRIB",
		"FRONT",
		"BACK",
		"FRONT_AND_BACK",
		"TEXTURE_2D",
		"CULL_FACE",
		"BLEND",
		"DITHER",
		"STENCIL_TEST",
		"DEPTH_TEST",
		"SCISSOR_TEST",
		"POLYGON_OFFSET_FILL",
		"SAMPLE_ALPHA_TO_COVERAGE",
		"SAMPLE_COVERAGE",
		"NO_ERROR",
		"INVALID_ENUM",
		"INVALID_VALUE",
		"INVALID_OPERATION",
		"OUT_OF_MEMORY",
		"CW",
		"CCW",
		"LINE_WIDTH",
		"ALIASED_POINT_SIZE_RANGE",
		"ALIASED_LINE_WIDTH_RANGE",
		"CULL_FACE_MODE",
		"FRONT_FACE",
		"DEPTH_RANGE",
		"DEPTH_WRITEMASK",
		"DEPTH_CLEAR_VALUE",
		"DEPTH_FUNC",
		"STENCIL_CLEAR_VALUE",
		"STENCIL_FUNC",
		"STENCIL_FAIL",
		"STENCIL_PASS_DEPTH_FAIL",
		"STENCIL_PASS_DEPTH_PASS",
		"STENCIL_REF",
		"STENCIL_VALUE_MASK",
		"STENCIL_WRITEMASK",
		"STENCIL_BACK_FUNC",
		"STENCIL_BACK_FAIL",
		"STENCIL_BACK_PASS_DEPTH_FAIL",
		"STENCIL_BACK_PASS_DEPTH_PASS",
		"STENCIL_BACK_REF",
		"STENCIL_BACK_VALUE_MASK",
		"STENCIL_BACK_WRITEMASK",
		"VIEWPORT",
		"SCISSOR_BOX",
		"COLOR_CLEAR_VALUE",
		"COLOR_WRITEMASK",
		"UNPACK_ALIGNMENT",
		"PACK_ALIGNMENT",
		"MAX_TEXTURE_SIZE",
		"MAX_VIEWPORT_DIMS",
		"SUBPIXEL_BITS",
		"RED_BITS",
		"GREEN_BITS",
		"BLUE_BITS",
		"ALPHA_BITS",
		"DEPTH_BITS",
		"STENCIL_BITS",
		"POLYGON_OFFSET_UNITS",
		"POLYGON_OFFSET_FACTOR",
		"TEXTURE_BINDING_2D",
		"SAMPLE_BUFFERS",
		"SAMPLES",
		"SAMPLE_COVERAGE_VALUE",
		"SAMPLE_COVERAGE_INVERT",
		"NUM_COMPRESSED_TEXTURE_FORMATS",
		"COMPRESSED_TEXTURE_FORMATS",
		"DONT_CARE",
		"FASTEST",
		"NICEST",
		"GENERATE_MIPMAP_HINT",
		"BYTE",
		"UNSIGNED_BYTE",
		"SHORT",
		"UNSIGNED_SHORT",
		"INT",
		"UNSIGNED_INT",
		"FLOAT",
		"FIXED",
		"DEPTH_COMPONENT",
		"ALPHA",
		"RGB",
		"RGBA",
		"LUMINANCE",
		"LUMINANCE_ALPHA",
		"UNSIGNED_SHORT_4_4_4_4",
		"UNSIGNED_SHORT_5_5_5_1",
		"UNSIGNED_SHORT_5_6_5",
		"FRAGMENT_SHADER",
		"VERTEX_SHADER",
		"MAX_VERTEX_ATTRIBS",
		"MAX_VERTEX_UNIFORM_VECTORS",
		"MAX_VARYING_VECTORS",
		"MAX_COMBINED_TEXTURE_IMAGE_UNITS",
		"MAX_VERTEX_TEXTURE_IMAGE_UNITS",
		"MAX_TEXTURE_IMAGE_UNITS",
		"MAX_FRAGMENT_UNIFORM_VECTORS",
		"SHADER_TYPE",
		"DELETE_STATUS",
		"LINK_STATUS",
		"VALIDATE_STATUS",
		"ATTACHED_SHADERS",
		"ACTIVE_UNIFORMS",
		"ACTIVE_UNIFORM_MAX_LENGTH",
		"ACTIVE_ATTRIBUTES",
		"ACTIVE_ATTRIBUTE_MAX_LENGTH",
		"SHADING_LANGUAGE_VERSION",
		"CURRENT_PROGRAM",
		"NEVER",
		"LESS",
		"EQUAL",
		"LEQUAL",
		"GREATER",
		"NOTEQUAL",
		"GEQUAL",
		"ALWAYS",
		"KEEP",
		"REPLACE",
		"INCR",
		"DECR",
		"INVERT",
		"INCR_WRAP",
		"DECR_WRAP",
		"VENDOR",
		"RENDERER",
		"VERSION",
		"EXTENSIONS",
		"NEAREST",
		"LINEAR",
		"NEAREST_MIPMAP_NEAREST",
		"LINEAR_MIPMAP_NEAREST",
		"NEAREST_MIPMAP_LINEAR",
		"LINEAR_MIPMAP_LINEAR",
		"TEXTURE_MAG_FILTER",
		"TEXTURE_MIN_FILTER",
		"TEXTURE_WRAP_S",
		"TEXTURE_WRAP_T",
		"TEXTURE",
		"TEXTURE_CUBE_MAP",
		"TEXTURE_BINDING_CUBE_MAP",
		"TEXTURE_CUBE_MAP_POSITIVE_X",
		"TEXTURE_CUBE_MAP_NEGATIVE_X",
		"TEXTURE_CUBE_MAP_POSITIVE_Y",
		"TEXTURE_CUBE_MAP_NEGATIVE_Y",
		"TEXTURE_CUBE_MAP_POSITIVE_Z",
		"TEXTURE_CUBE_MAP_NEGATIVE_Z",
		"MAX_CUBE_MAP_TEXTURE_SIZE",
		"TEXTURE0",
		"TEXTURE1",
		"TEXTURE2",
		"TEXTURE3",
		"TEXTURE4",
		"TEXTURE5",
		"TEXTURE6",
		"TEXTURE7",
		"TEXTURE8",
		"TEXTURE9",
		"TEXTURE10",
		"TEXTURE11",
		"TEXTURE12",
		"TEXTURE13",
		"TEXTURE14",
		"TEXTURE15",
		"TEXTURE16",
		"TEXTURE17",
		"TEXTURE18",
		"TEXTURE19",
		"TEXTURE20",
		"TEXTURE21",
		"TEXTURE22",
		"TEXTURE23",
		"TEXTURE24",
		"TEXTURE25",
		"TEXTURE26",
		"TEXTURE27",
		"TEXTURE28",
		"TEXTURE29",
		"TEXTURE30",
		"TEXTURE31",
		"ACTIVE_TEXTURE",
		"REPEAT",
		"CLAMP_TO_EDGE",
		"MIRRORED_REPEAT",
		"FLOAT_VEC2",
		"FLOAT_VEC3",
		"FLOAT_VEC4",
		"INT_VEC2",
		"INT_VEC3",
		"INT_VEC4",
		"BOOL",
		"BOOL_VEC2",
		"BOOL_VEC3",
		"BOOL_VEC4",
		"FLOAT_MAT2",
		"FLOAT_MAT3",
		"FLOAT_MAT4",
		"SAMPLER_2D",
		"SAMPLER_CUBE",
		"VERTEX_ATTRIB_ARRAY_ENABLED",
		"VERTEX_ATTRIB_ARRAY_SIZE",
		"VERTEX_ATTRIB_ARRAY_STRIDE",
		"VERTEX_ATTRIB_ARRAY_TYPE",
		"VERTEX_ATTRIB_ARRAY_NORMALIZED",
		"VERTEX_ATTRIB_ARRAY_POINTER",
		"VERTEX_ATTRIB_ARRAY_BUFFER_BINDING",
		"IMPLEMENTATION_COLOR_READ_TYPE",
		"IMPLEMENTATION_COLOR_READ_FORMAT",
		"COMPILE_STATUS",
		"INFO_LOG_LENGTH",
		"SHADER_SOURCE_LENGTH",
		"SHADER_COMPILER",
		"SHADER_BINARY_FORMATS",
		"NUM_SHADER_BINARY_FORMATS",
		"LOW_FLOAT",
		"MEDIUM_FLOAT",
		"HIGH_FLOAT",
		"LOW_INT",
		"MEDIUM_INT",
		"HIGH_INT",
		"FRAMEBUFFER",
		"RENDERBUFFER",
		"RGBA4",
		"RGB5_A1",
		"RGB565",
		"DEPTH_COMPONENT16",
		"STENCIL_INDEX8",
		"RENDERBUFFER_WIDTH",
		"RENDERBUFFER_HEIGHT",
		"RENDERBUFFER_INTERNAL_FORMAT",
		"RENDERBUFFER_RED_SIZE",
		"RENDERBUFFER_GREEN_SIZE",
		"RENDERBUFFER_BLUE_SIZE",
		"RENDERBUFFER_ALPHA_SIZE",
		"RENDERBUFFER_DEPTH_SIZE",
		"RENDERBUFFER_STENCIL_SIZE",
		"FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE",
		"FRAMEBUFFER_ATTACHMENT_OBJECT_NAME",
		"FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL",
		"FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE",
		"COLOR_ATTACHMENT0",
		"DEPTH_ATTACHMENT",
		"STENCIL_ATTACHMENT",
		"NONE",
		"FRAMEBUFFER_COMPLETE",
		"FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
		"FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
		"FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
		"FRAMEBUFFER_UNSUPPORTED",
		"FRAMEBUFFER_BINDING",
		"RENDERBUFFER_BINDING",
		"MAX_RENDERBUFFER_SIZE",
		"INVALID_FRAMEBUFFER_OPERATION" ];
	cls.addVars(glesEnums, extern.cachedVars.Real64, function(name) {
		return "GL_" + name;
	});
	cls.finish();	
});
