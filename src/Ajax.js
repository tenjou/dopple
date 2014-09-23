"use strict";

var meta = {};

meta.serialize = function(obj)
{
	var str = [];
	for(var key in obj) {
		str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
	}

	return str.join("&");
};

meta.ajax = function(params)
{
	if(params.dataType === "html") {
		params.responseType = "document";
	}
	else if(params.dataType === "script" || params.dataType === "json") {
		params.responseType = "text";
	}
	else if(params.dataType === void(0)) {
		params.responseType = "GET";
	}
	else {
		params.responseType = params.dataType;
	}

	if(params.type === void(0)) {
		params.type = "GET";
	}	

	var data = meta.serialize(params.data);

	var xhr = new XMLHttpRequest();
	xhr.open(params.type, params.url, true);
	xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");

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