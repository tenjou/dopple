"use strict";

function main()
{
	var docMgr = new DocManager();

	meta.ajax({
		url: "db.json",
		dataType: "json",
		success: function(db) {
			docMgr.load(db);
		}
	});
}

function DocManager()
{
	this.internal = null;
	this.typeMap = null;

	this.navBar = null;
	this.navSection = {
		scope: null,
		cls: null,
		func: null,
		enum: null,
		global: null
	};
	this.navContent = {
		scope: null,
		cls: null,
		func: null,
		enum: null,
		global: null
	};

	this.innerSection = {
		scope: null,
		cls: null,
		func: null,
		enum: null,
		var: null
	}
	this.innerContentElement = null;
	this.innerContent = {
		type: null,
		name: null,
		description: null,
		scope: null,
		cls: null,
		func: null,
		enum: null,
		var: null
	};

	this.searchBar = null;
	this.element = null;
	this.content = null;
	this.items = null;

	this.all = null;
	this.classes = null;
	this.funcs = null;
	this.enums = null;

	this.funcNavItemOnClick = null;
	this.funcDocItemOnClick = null;
	this.activeItem = null;

	this.title = "";
	this.mainContentName = "";
	this.currContentName = null;
	this.contentBuffer = null;

	this.scopeName = "";
	this.searchTerm = "";

	//
	this.init();
}

DocManager.prototype = 
{
	init: function()
	{
		this.title = document.title;
		this.element = document.querySelector("docs");

		this.createNav();
		this.createDocs();

		var self = this;
		window.addEventListener("hashchange", 
			function() {
				self.onHashChange();
			});
	},

	createNav: function()
	{
		this.navBar = document.createElement("nav");
		this.element.appendChild(this.navBar);

		this.navSection.scope = this.createSection("Scopes", this.navBar);
		this.navContent.scope = this.navSection.scope.children[1];

		this.navSection.cls = this.createSection("Classes", this.navBar);
		this.navContent.cls = this.navSection.cls.children[1];

		this.navSection.func = this.createSection("Functions", this.navBar);
		this.navContent.func = this.navSection.func.children[1];

		this.navSection.enum = this.createSection("Enums", this.navBar);
		this.navContent.enum = this.navSection.enum.children[1];

		this.navSection.global = this.createSection("Globals", this.navBar);
		this.navContent.global = this.navSection.global.children[1];

		var self = this;
		this.funcNavItemOnClick = function(event) {
			event.preventDefault();
			self.loadContent(event.target.innerHTML);
			window.scrollTo(0, 0);
		};
	},

	createSection: function(name, parent)
	{
		var section = document.createElement("section");
		section.setAttribute("class", "hidden");

		var h3 = document.createElement("h3");
		h3.innerHTML = name;
		section.appendChild(h3);

		var content = document.createElement("content");
		section.appendChild(content);

		parent.appendChild(section);

		return section;
	},

	createDocs: function()
	{
		this.innerContentElement = document.createElement("inner");
		this.element.appendChild(this.innerContentElement);

		this.createSearchBar();

		this.innerContent.type = document.createElement("type");
		this.innerContentElement.appendChild(this.innerContent.type);
		this.innerContent.name = document.createElement("name");
		this.innerContentElement.appendChild(this.innerContent.name);

		this.innerContent.description = document.createElement("p");
		this.innerContentElement.appendChild(this.innerContent.description);

		this.innerSection.scope = this.createSection("Scopes", this.innerContentElement);
		this.innerContent.scope = this.innerSection.scope.children[1];

		this.innerSection.cls = this.createSection("Classes", this.innerContentElement);
		this.innerContent.cls = this.innerSection.cls.children[1];

		this.innerSection.func = this.createSection("Functions", this.innerContentElement);
		this.innerContent.func = this.innerSection.func.children[1];

		this.innerSection.enum = this.createSection("Enums", this.innerContentElement);
		this.innerContent.enum = this.innerSection.enum.children[1];

		this.innerSection.var = this.createSection("Vars", this.innerContentElement);
		this.innerContent.var = this.innerSection.var.children[1];

		var self = this;
		this.funcDocItemOnClick = function(event) {
			event.preventDefault();
			window.location.href = event.currentTarget.getAttribute("href");
			window.scrollTo(0, 0);
			self.loadFromUrl();
		};
	},

	createSearchBar: function()
	{
		this.searchBar = document.createElement("input");
		this.searchBar.placeholder = "Click or press 'S' button";
		this.innerContentElement.appendChild(this.searchBar);

		var self = this;
		document.addEventListener("keyup", 
			function(event) 
			{
				if(self.searchBar === document.activeElement)
				{
					// Enter 
					if(event.keyCode === 13) {
						self.search(self.searchBar.value);
					}
					else if(event.keyCode === 27) {
						self.searchBar.value = "";
					}	

					return;
				}

				// S
				if(event.keyCode === 83) {
					self.searchBar.select();
				}
			});
	},

	load: function(data)
	{
		this.internal = data.__internal__;
		delete data.__internal__;

		var types = this.internal.type;
		this.typeMap = {};
		for(var key in types) {
			this.typeMap[types[key]] = parseInt(key);
		}

		this.items = {};
		this.all = {};

		this.parseScope("", data);

		if(!this.mainContentName) 
		{
			for(var key in this.all) {
				this.mainContentName = key;
				break;
			}
		}

		this.loadFromUrl();
	},

	parse: function(name, data)
	{
		// Class
		if(data.type > this.internal.maxInternalTypeId) 
		{
			if(this.scopeName) {
				name = this.scopeName + "." + name;
			}

			if(!this.classes) 
			{
				this.navSection.cls.setAttribute("class", "");
				this.classes = {};
			}

			var item = document.createElement("a");
			item.setAttribute("href", "#" + name);
			item.onclick = this.funcNavItemOnClick;
			item.innerHTML = name;
			this.navContent.cls.appendChild(item);

			this.all[name] = data;
			this.classes[name] = data;
			this.items[name] = item;

			this.parseScope(name, data.value);	
		}
	},

	parseScope: function(name, data)
	{
		this.scopeName = name;

		for(var key in data) {
			this.parse(key, data[key]);
		}

		this.scopeName = this.scopeName.substr(0, this.scopeName.lastIndexOf("."));
	},

	clearContent: function()
	{
		// hide sections:
		for(var key in this.innerSection) {
			this.innerSection[key].setAttribute("class", "hidden");
		}

		// hide content:
		var content;
		for(key in this.innerContent)
		{
			content = this.innerContent[key];
			while(content.lastChild) {
				content.removeChild(content.lastChild);
			}
		}	

		//this.breadCrumbs.innerHTML = "";
	},

	pushContentItem: function(scopeName, name, item)
	{
		var itemElement = document.createElement("a");
		itemElement.onclick = this.funcDocItemOnClick;

		if(scopeName)
		{
			itemElement.setAttribute("href", "#" + scopeName + "." + name);

			if(this.searchTerm)
			{
				var scopeElement = document.createElement("scope");
				scopeElement.innerHTML = scopeName + ".";
				itemElement.appendChild(scopeElement);	
			}
		}
		else {
			itemElement.setAttribute("href", "#" + name);		
		}

		if(this.searchTerm)
		{
			// get the last part of search term:
			var term;
			if(this.searchTerm.indexOf(".") > -1)
			{
				var buffer = this.searchTerm.split(".");
				term = buffer[buffer.length - 1];
			}
			else {
				term = this.searchTerm;
			}
			
			var strIndex = name.toLowerCase().indexOf(term);

			itemElement.innerHTML += name.substr(0, strIndex);

			var termElement = document.createElement("term");
			termElement.innerHTML = name.substr(strIndex, this.searchTerm.length);
			itemElement.appendChild(termElement);

			itemElement.innerHTML += name.substr(strIndex + this.searchTerm.length);
		}
		else {
			itemElement.innerHTML += name;
		}

		if(item.type > this.internal.maxInternalTypeId)
		{
			this.innerSection.cls.setAttribute("class", "");
			parent = this.innerContent.cls;
		}
		else
		{
			switch(item.type)
			{
				case this.typeMap.Function:
					this.innerSection.func.setAttribute("class", "");
					parent = this.innerContent.func;
					break;

				case this.typeMap.Number:
				case this.typeMap.Bool:
				case this.typeMap.String:
				case this.typeMap.Object:
				case this.typeMap.SetterGetter:
					this.innerSection.var.setAttribute("class", "");
					parent = this.innerContent.var;
					break;
			}
		}

		if(parent) {
			parent.appendChild(itemElement);
		}
	},

	_loadContent: function(name, data)
	{
		this.clearContent();

		var typeName;
		switch(data.type)
		{
			case this.typeMap.Number:
			case this.typeMap.Bool:
			case this.typeMap.String:
			case this.typeMap.SetterGetter:
			case this.typeMap.Object:
				typeName = "Var";
				break;

			case this.typeMap.Function:
				typeName = "Function";
				break;

			default:
			{
				if(data.type > this.internal.maxInternalTypeId) 
				{
					typeName = "Class";

					var classData = data.value;
					for(var key in classData) {
						this.pushContentItem(name, key, classData[key]);
					}
				}
				else {
					typeName = "Unknown";
				}			
			} break;
		}

		this.innerContent.type.innerHTML = typeName;

		// load title with breadcrumbs:
		var href;
		var url = "#";
		var num = this.contentBuffer.length - 1;
		for(var n = 0; n < num; n++) 
		{
			name = this.contentBuffer[n];
			url += name;

			href = document.createElement("a");
			href.setAttribute("href", url);
			href.innerHTML = name;
			this.innerContent.name.appendChild(href);
			this.innerContent.name.innerHTML += ".";

			url += ".";
		}

		name = this.contentBuffer[n];
		url += name;

		href = document.createElement("a");
		href.setAttribute("href", url);
		href.innerHTML = name;
		this.innerContent.name.appendChild(href);
	},

	loadContent: function(contentName)
	{
		if(this.currContentName === contentName) { return; }

		var data = this.findContentFromName(contentName);
		if(!data) {
			return;
		}

		var item = this.items[this.currContentName];
		if(this.activeItem) {
			this.activeItem.setAttribute("class", "");
		}

		if(item) {
			this.activeItem = item;
			this.activeItem.setAttribute("class", "active");
		}
	
		document.title = this.title + " - " + this.currContentName;	
		window.location.hash = this.currContentName;

		this._loadContent(this.currContentName, data);
	},

	loadFromUrl: function()
	{
		var contentName = window.location.hash.substr(1);

		var paramIndex = contentName.indexOf("=");
		if(paramIndex > 0) 
		{
			var cmd = contentName.substr(0, paramIndex);
			if(cmd === "search") {
				this.searchBar.value = contentName.substr(paramIndex + 1);
				this.search(this.searchBar.value);
				return;
			}
			else {
				contentName = this.contentName;
			}
		}

		this.loadContent(contentName);
	},

	findContentFromName: function(contentName)
	{
		if(!contentName) {
			contentName = this.mainContentName;
		}

		this.contentBuffer = contentName.split(".");
		var num = this.contentBuffer.length;
		var scope = this.all;
		var name, item;

		for(var n = 0; n < num; n++)
		{
			name = this.contentBuffer[n];
			item = scope[name];
			if(!item) {
				return null;
			}

			if(item.type > this.internal.maxInternalTypeId) {
				scope = item.value;
			}
		}

		if(n === num) 
		{
			this.currContentName = contentName;
			return item;
		}

		return null;
	},

	search: function(str) 
	{
		this.clearContent();
		if(this.activeItem) {
			this.activeItem.setAttribute("class", "");
		}		

		window.location.hash = "search=" + str;
		document.title = this.title + " - Search: " + str;

		this.currContentName = "";
		this.searchTerm = str.toLowerCase();
		this.innerContent.type.innerHTML = "Results";

		var periodIndex = str.indexOf(".");
		if(periodIndex > -1) {
			this._searchAsBuffer();
		}
		else
		{
			var item;
			for(var key in this.all)
			{
				item = this.all[key];

				if(key.toLowerCase().lastIndexOf(this.searchTerm) > -1) {
					this.pushContentItem("", key, item);
				}
				
				if(item.type > this.internal.maxInternalTypeId) 
				{
					var scopeName = key;
					var data = item.value;

					for(var keyData in data)
					{
						item = data[keyData];

						if(item.type > this.internal.maxInternalTypeId) {
							continue;
						}

						if(keyData.toLowerCase().lastIndexOf(this.searchTerm) > -1) {
							this.pushContentItem(scopeName, keyData, item);
						}
					}
				}
			}
		}

		this.searchTerm = "";
	},	

	_searchAsBuffer: function()
	{
		var buffer = this.searchTerm.split(".");
		var num = buffer.length;
		if(num > 1)
		{
			var name, item;
			var scope = this.all;
			var scopeName = "";

			for(var n = 0; n < num - 1; n++)
			{
				name = buffer[n];
				if(!name) { return; }

				item = scope[name];
				if(!item) { return; }

				if(item.type > this.internal.maxInternalTypeId) 
				{
					if(scopeName) {
						scopeName += ".";
					}
					scopeName += name;
					
					scope = item.value;
				}
			}

			name = buffer[n];
			if(!name) { return; }
		
			var index;
			for(var key in scope)
			{
				index = key.toLowerCase().indexOf(name);
				if(index > -1) {
					this.pushContentItem(scopeName, key, scope[key]);
				}
			}
		}		
	},

	onHashChange: function() {
		this.loadFromUrl();
	}
};
