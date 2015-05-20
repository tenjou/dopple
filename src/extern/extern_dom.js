"use strict";

dopple.extern("dom", function(extern) 
{
	var externCls = extern.addClass("Element");
	externCls.finish();

	externCls = extern.addClass("Image");
	externCls.addFunc("onload", [ extern.cachedVars.Function ], null);
	externCls.addMutator("src", extern.nativeVars.String).flags |= dopple.Flag.SETTER | dopple.Flag.GETTER;
	externCls.finish();

	externCls = extern.addClass("CanvasElement");
	externCls.addFunc("getContext", [ extern.cachedVars.String ], extern.create(extern.vars.WebGLRenderingContext));
	externCls.addMutator("width", extern.nativeVars.Real64).flags |= dopple.Flag.SETTER | dopple.Flag.GETTER;
	externCls.addMutator("height", extern.nativeVars.Real64).flags |= dopple.Flag.SETTER | dopple.Flag.GETTER;
	externCls.finish();		

	externCls = extern.addClass("Document");
	externCls.addFunc("getElementById", [ extern.cachedVars.String ], extern.create(extern.vars.CanvasElement));
	externCls.finish();

	externCls = extern.addClass("Window");
	externCls.addNew("document", "Document");
	externCls.addFunc("requestAnimationFrame", [ extern.cachedVars.Function ], null);
	externCls.finish();

	extern.addNew("window", "Window");
	extern.addRef("document", "window.document");	
});
