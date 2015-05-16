"use strict";

var dopple = 
{
	extern: function(id, loaderFunc) 
	{
		var loader = this.loaders[id];
		if(loader) {
			throw "There is already added loader with an id: " + id;
		}

		this.loaders[id] = loaderFunc;
	},

	load: function(id)
	{
		var loader = this.loaders[id];
		if(!loader) {
			throw "There are no loaders with an id: " + id;
		}

		loader(this.externInterface);
	},

	importAcorn: function(ast) 
	{
		this.scope = new dopple.Scope();
		this.resolver = new dopple.Resolver(this.scope);

		this.externInterface = new dopple.Extern(this.scope);
		this.load("core");
		this.load("webgl");
		this.load("dom");

		var createCall = new dopple.AST.FunctionCall("__dopple__create", null, null, null);
		this.scope.body.push(createCall);		

		dopple.acorn.parse(this.scope, ast);

		var destroyCall = new dopple.AST.FunctionCall("__dopple__destroy", null, null, null);
		this.scope.body.push(destroyCall);			
	},

	resolve: function() {
		this.resolver.do();
	},

	compile: function() 
	{
		var result = "";
		var compiler = dopple.compiler.cpp;

//		try {
//			try {
				compiler.prepare();
				this.resolve();
				//console.log(this.scope);
				result = compiler.compile();
			// }
			// catch(err) {
			// 	console.error(err);
			// }
		// }
		// catch(err) {
		// 	console.error(err);
		// }

		return result;
	},

	erorr: function(msg) {
		throw new SyntaxError(msg);
	},

	//
	scope: null,
	externInterface: null,
	resolver: null,

	nativeVars: {},
	loaders: {}
};
