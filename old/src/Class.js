"use strict";

(function(scope)
{
	var initializing = false, fnTest = /\b_super\b/;

	scope.dopple.Class = function() {};
	scope.dopple.Class.extend = function(prop)
	{
		var _super = this.prototype;

		initializing = true;
		var proto = new this();
		initializing = false;

		for(var name in prop)
		{
			var p = Object.getOwnPropertyDescriptor(prop, name);
			if(p.get || p.set) {
				Object.defineProperty(proto,name,p);
				continue;
			}

			if(typeof prop[name] == "function"
				&& typeof _super[name] == "function"
				&& fnTest.test(prop[name]) )
			{
				proto[name] = (function(name, fn)
				{
					return function(a, b, c, d, e, f)
					{
						var tmp = this._super;
						this._super = _super[name];
						this._fn = fn;
						var ret = this._fn(a, b, c, d, e, f);

						this._super = tmp;

						return ret;
					};
				})(name, prop[name]);
				continue;
			}

			proto[name] = prop[name];
		}

		function Class(a, b, c, d, e, f)
		{
			if(!initializing)
			{
				if(this._init) {
					this._init(a, b, c, d, e, f);
				}
				if(this.init) {
					this.init(a, b, c, d, e, f);
				}
			}
		}

		Class.prototype = proto;
		Class.prototype.constructor = proto.init;
		Class.extend = this.extend;

		return Class;
	};

	scope.dopple["Class"] = scope.dopple.Class;
})(typeof window !== void(0) ? window : global);
