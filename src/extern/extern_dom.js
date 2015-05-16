"use strict";

dopple.extern("dom", function(extern) 
{
	var cls = extern.addClass("Element");
	cls.finish();

	cls = extern.addClass("CanvasElement");
	cls.addFunc("getContext", [ extern.cachedVars.String ], extern.createParam(extern.vars.WebGLRenderingContext));
	cls.addVar("width", extern.cachedVars.Number);
	cls.addVar("height", extern.cachedVars.Number);
	cls.finish();		

	cls = extern.addClass("Document");
	cls.addFunc("getElementById", [ extern.cachedVars.String ], extern.createParam(extern.vars.CanvasElement));
	cls.finish();

	cls = extern.addClass("Window");
	cls.addNew("document", "Document");
	cls.addFunc("requestAnimationFrame", [ extern.cachedVars.Function ], null);
	cls.finish();

	extern.addNew("window", "Window");
	extern.addRef("document", "window.document");	
});