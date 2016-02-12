"use strict";

var meta = {};

"use strict";

meta.ajax = function(params)
{
	var data = meta.serialize(params.data);
	var xhr = new XMLHttpRequest();

	if(params.dataType === "html") {
		params.responseType = "document";
	}
	else if(params.dataType === "script" || params.dataType === "json") {
		params.responseType = "text";
	}
	else if(params.dataType === void(0)) {
		params.responseType = "GET";
		xhr.overrideMimeType("text/plain");
	}
	else {
		params.responseType = params.dataType;
	}

	if(params.type === void(0)) {
		params.type = "GET";
	}	

	xhr.open(params.type, params.url, true);
	xhr.onload = function()
	{
		if(xhr.readyState === 4 && xhr.status === 200)
		{
			if(params.success !== void(0))
			{
				if(params.responseType === "document") {
					params.success(xhr.responseXML);
				}
				else if(params.dataType === "script") {
					params.success(eval(xhr.responseText));
				}
				else if(params.dataType === "json") {
					params.success(JSON.parse(xhr.responseText));
				}
				else {
					params.success(xhr.responseText);
				}
			}
		}
		else
		{
			if(params.error !== void(0)) {
				params.error();
			}
		}
	};

	xhr.send(data);

	return xhr;
};

"use strict";

(function(scope) 
{
	if(!scope.meta) {
		scope.meta = {};
	}

	var initializing = false;
	var fnTest = /\b_super\b/;
	var holders = {};

	meta.class = function(clsName, extendName, prop, cb) 
	{
		if(!initializing) {
			meta.class._construct(clsName, extendName, prop, cb);
		}
	};

	meta.class._construct = function(clsName, extendName, prop, cb) 
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

				holder.classes.push(new ExtendItem(clsName, prop, cb));			
				return;
			}			
		}		

		Extend(clsName, extend, prop, cb);  	
	};

	function Extend(clsName, extend, prop, cb) 
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
			if(!initializing) 
			{
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
		cls.prototype.__lastName__ = name;
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
				Extend(extendItem.name, cls, extendItem.prop, extendItem.cb);
			}

			delete holders[clsName];		
		}

		if(cb) {
			cb(cls, clsName);
		}
	};

	function ExtendHolder() {
		this.classes = [];
	};

	function ExtendItem(name, prop, cb) {
		this.name = name;
		this.prop = prop;
		this.cb = cb;
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
})(typeof(window) !== void(0) ? window : global);

meta.enumNames = function(baseName, mask, min, max)
{
	var names = new Array(max - min);

	var maskLength = mask.length;
	var numbers;

	for(var n = min; n <= max; n++) {
		numbers = Math.floor(n / 10);
		names[n] = baseName + mask.substr(0, maskLength - numbers - 1) + n;
	}

	return names;
};

meta.getNameFromPath = function(path)
{
	var wildcardIndex = path.lastIndexOf(".");
	var slashIndex = path.lastIndexOf("/");

	// If path does not have a wildcard:
	if(wildcardIndex < 0 || (path.length - wildcardIndex) > 5) { 
		return path.slice(slashIndex + 1);
	}

	return path.slice(slashIndex + 1, wildcardIndex);
};

meta.randomItem = function(array) {
	return array[meta.random.number(0, array.length - 1)];
};

meta.onDomLoad = function(func)
{
	if((document.readyState === "interactive" || document.readyState === "complete")) {
		func();
		return;
	}

	var cbFunc = function(event) {
		func();
		window.removeEventListener("DOMContentLoaded", cbFunc);
	};

	window.addEventListener("DOMContentLoaded", cbFunc);
};

/**
 * Get enum key as string.
 * @param buffer {Object} Enum object where key is located.
 * @param value {*} Value of the key which needs to be converted.
 * @returns {string} Converted enum to string.
 */
meta.enumToString = function(buffer, value)
{
	if(buffer === void(0)) {
		return "unknown";
	}

	for(var enumKey in buffer)
	{
		if(buffer[enumKey] === value) {
			return enumKey;
		}
	}

	return "unknown";
};

/**
 * Convert hex string to object with RGB values.
 * @param hex {String} Hex to convert.
 * @return {{r: Number, g: Number, b: Number}} Object with rgb values.
 */
meta.hexToRgb = function(hex)
{
	if(hex.length < 6) {
		hex += hex.substr(1, 4);
	}

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	}
};

/**
 * Check if string is url.
 * @param str {string} String to check.
 * @returns {boolean} <b>true</b> if is url.
 */
meta.isUrl = function(str)
{
	if(str.indexOf("http://") !== -1 || str.indexOf("https://") !== -1) {
		return true;
	}

	return false;
};

/**
 * Change to upper case first character of the string.
 * @param str {String} String to perform action on.
 * @returns {String}
 */
meta.toUpperFirstChar = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};


meta.serialize = function(obj)
{
	var str = [];
	for(var key in obj) {
		str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
	}

	return str.join("&");
};

meta.removeFromArray = function(item, array) 
{
	var numItems = array.length;
	for(var i = 0; i < numItems; i++) {
		if(item === array[i]) {
			array[i] = array[numItems - 1];
			array.pop();
			break;
		}
	}
};

meta.shuffleArray = function(array) 
{
	var rand = meta.random;
	var length = array.length
	var temp, item;

	while(length) 
	{
		item = rand.number(0, --length);

		temp = array[length];
		array[length] = array[item];
		array[item] = temp;
	}

	return array;
};

meta.shuffleArrayRange = function(array, endRange, startRange) 
{
	var startRange = startRange || 0;
	var rand = meta.random;
	var temp, item;

	while(endRange > startRange) 
	{
		item = rand.number(0, --endRange);

		temp = array[endRange];
		array[endRange] = array[item];
		array[item] = temp;
	}

	return array;
};

meta.mapArray = function(array)
{
	var obj = {};
	var num = array.length;
	for(var n = 0; n < num; n++) {
		obj[array[n]] = n;
	}

	return obj;
};

meta.rotateArray = function(array)
{
	var tmp = array[0];
	var numItems = array.length - 1;
	for(var i = 0; i < numItems; i++) {
		array[i] = array[i + 1];
	}
	array[numItems] = tmp;
};

meta.nextPowerOfTwo = function(value)
{
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;

    return value;	
};

meta.toHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

meta.rgbToHex = function(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

function isSpace(c) {
	return (c === " " || c === "\t" || c === "\r" || c === "\n");
};

function isNewline(c) {
	return (c === "\r" || c === "\n");
};

function isDigit(c) {
	return (c >= "0" && c <= "9") || (c === ".");
};

function isAlpha(c) 
{
	return (c >= "a" && c <= "z") ||
		   (c >= "A" && c <= "Z") ||
		   (c == "_" && c <= "$");
};

function isAlphaNum(c) 
{
	return (c >= "a" && c <= "z") ||
		   (c >= "A" && c <= "Z") ||
		   (c >= "0" && c <= "9") ||
		   c === "_" || c === "$";
};

function isBinOp(c) 
{
	return (c === "=" || c === "!" || c === "<" || c === ">" || 
			c === "+" || c === "-" || c === "*" || c === "/" ||
			c === "&" || c === "~" || c === "|" || c === "%");
};

function getClsFromPath(path)
{
	var cls = null;
	var scope = window;
	var num = path.length;
	for(var i = 0; i < num; i++) {
		scope = scope[path[i]];
		if(!scope) {
			return null;
		}
	}

	return cls;
};

meta.decodeBinaryBase64 = function(content)
{
	var decodedData = atob(content);
	var size = decodedData.length;
	var data = new Array(size / 4);

	for(var n = 0, i = 0; n < size; n += 4, i++)
	{
		data[i] = decodedData.charCodeAt(n) | 
				  decodedData.charCodeAt(n + 1) << 8 |
				  decodedData.charCodeAt(n + 2) << 16 |
				  decodedData.charCodeAt(n + 3) << 24;
	}

	return data;
}
