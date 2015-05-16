"use strict";

dopple.extern("dom", function(extern) 
{
	var cls = extern.addClass("Element");
	cls.finish();

	cls = extern.addClass("CanvasElement");
	cls.addFunc("getContext", [ vars.String ], vars.WebGLRenderingContext);
	cls.addVar("width", vars.Number);
	cls.addVar("height", vars.Number);
	cls.finish();		

	cls = extern.addClass("Document");
	cls.addFunc("getElementById", [ vars.String ], vars.CanvasElement);
	cls.finish();

	cls = extern.addClass("Window");
	cls.addNew("document", "Document");
	cls.addFunc("requestAnimationFrame", [ vars.Function ], null);
	cls.finish();

	extern.addNew("window", "Window");
	extern.addRef("document", "window.document");	
});
