"use strict";

(function(scope) 
{
	if(!scope.meta) {
		scope.meta = {};
	}

	var initializing = false;
	var fnTest = /\b_super\b/;
	var holders = {};

	meta.class = function(clsName, extendName, prop) 
	{
		if(!initializing) {
			meta.class._construct(clsName, extendName, prop);
		}
	};

	meta.class._construct = function(clsName, extendName, prop) 
	{
		if(!clsName) {
			console.error("(meta.class) Invalid class name");
			return;
		}

		if(!prop) {
			prop = extendName;
			extendName = null; 
		}
		if(!prop) {
			prop = {};	
		}

		var extend = null;

		if(extendName)
		{
			var prevScope = null;
			var extendScope = window;
			var extendScopeBuffer = extendName.split(".");
			var num = extendScopeBuffer.length - 1;
			
			for(var n = 0; n < num; n++) 
			{
				prevScope = extendScope;
				extendScope = extendScope[extendScopeBuffer[n]];
				if(!extendScope) {
					extendScope = {};
					prevScope[extendScopeBuffer[n]] = extendScope;				
				}
			}	

			var name = extendScopeBuffer[num];
			extend = extendScope[name];
			if(!extend) 
			{
				var holder = holders[extendName];
				if(!holder) {
					holder = new ExtendHolder();
					holders[extendName] = holder;
				}

				holder.classes.push(new ExtendItem(clsName, prop));			
				return;
			}			
		}		

		Extend(clsName, extend, prop);  	
	};

	function Extend(clsName, extend, prop) 
	{
		var prevScope = null;
		var scope = window;
		var scopeBuffer = clsName.split(".");
		var num = scopeBuffer.length - 1;
		var name = scopeBuffer[num];

		for(var n = 0; n < num; n++) 
		{
			prevScope = scope;
			scope = scope[scopeBuffer[n]];
			if(!scope) {
				scope = {};
				prevScope[scopeBuffer[n]] = scope;
			}
		}

		var extendHolder = holders[clsName];
		var prevCls = scope[name];
		var cls = function Class(a, b, c, d, e, f) 
		{
			if(!initializing) {
				if(this._init) { 
					this._init(a, b, c, d, e, f); 
				}
				if(this.init) { 
					this.init(a, b, c, d, e, f); 
				}
			}
		};		

		var proto = null;
		var extendProto = null;

		if(extend) {
			initializing = true;
			proto = new extend();
			extendProto = proto.__proto__;
			initializing = false;
		}
		else {
			initializing = true;
			proto = new meta.class();
			initializing = false;
		}			

		for(var key in prop)
		{
			var p = Object.getOwnPropertyDescriptor(prop, key);
			if(p.get || p.set) {
				Object.defineProperty(proto, key, p);
				continue;
			}

			if(extend)
			{
				if(typeof(prop[key]) == "function" 
					&& typeof extendProto[key] == "function" 
					&& fnTest.test(prop[key]))
				{
					proto[key] = (function(key, fn)
					{
						return function(a, b, c, d, e, f)
						{
							var tmp = this._super;
							this._super = extendProto[key];
							this._fn = fn;
							var ret = this._fn(a, b, c, d, e, f);

							this._super = tmp;

							return ret;
						};
					})(key, prop[key]);
					continue;
				}
			}

			proto[key] = prop[key];
		}

		cls.prototype = proto;
		cls.prototype.__name__ = clsName;
		cls.prototype.constructor = proto.init || null;
		scope[name] = cls;

		if(prevCls) {
			for(var key in prevCls) {
				cls[key] = prevCls[key];
			}
		}

		if(extendHolder) {
			var extendItem = null;
			var classes = extendHolder.classes;
			num = classes.length;
			for(n = 0; n < num; n++) {
				extendItem = classes[n];
				Extend(extendItem.name, cls, extendItem.prop);
			}	

			delete holders[clsName];		
		}
	};

	function ExtendHolder() {
		this.classes = [];
	};

	function ExtendItem(name, prop) {
		this.name = name;
		this.prop = prop;
	};

	meta.classLoaded = function()
	{
		var i = 0;
		var holder = null;
		var classes = null;
		var numClasses = 0;

		for(var key in holders) {
			holder = holders[key];
			console.error("Undefined class: " + key);
			classes = holder.classes;
			numClasses = classes.length;
			for(i = 0; i < numClasses; i++) {
				console.error("Undefined class: " + classes[i].name);
			}
		}

		holder = {};
	};			
})(typeof window !== void(0) ? window : global);
