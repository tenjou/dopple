"use strict";

dopple.resolver = 
{
	resolve: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;

		dopple.extern.loadPrimitives();

		// try {
		 	this.resolveBody(scope.body);
		// }
		// catch(error) {
		// 	console.error(error);
		// }
	},

	resolveBody: function(nodes)
	{
		var node;
		var num = nodes.length;
		for(var n = 0; n < num; n++)
		{
			node = nodes[n];
			if(!node) { continue; }

			switch(node.exprType)
			{
				case this.exprType.VAR:
					this.resolveVar(node);
					break;

				case this.exprType.STRING:
				case this.exprType.NUMBER:
					nodes[n] = null;
					break;

				case this.exprType.FUNCTION_CALL:
					this.resolveFuncCall(node);
					break;

				case this.exprType.FUNCTION:
					this.resolveFunc(node);
					break;

				case this.exprType.OBJECT_PROPERTY:
					this.resolveObjProp(node);
					break;

				case this.exprType.ASSIGN:
					this.resolveAssign(node);
					break;

				case this.exprType.SETTER:
					this.resolveSetter(node);
					break;
				case this.exprType.GETTER:
					this.resolveGetter(node);
					break;

				// case this.exprType.MEMBER:
				// 	this.resolveMember(node);
				// 	break;

				case this.exprType.CLASS:
					this.resolveCls(node);
					break;
			}
		}
	},

	resolveVar: function(node)
	{
		var name = node.ref.name.value;
		var expr = this.scope.vars[name];

		if(node.ref.value) {
			node.ref.value = this.resolveValue(node.ref.value);
		}

		this.scope.vars[name] = node;
	},

	resolveRef: function(node)
	{
		this.resolveName(node.name);

		if(node.value)
		{
			var exprType = node.value.exprType;
			switch(exprType)
			{
				case this.exprType.OBJECT:
				{
					this.resolveObjAsCls(node);
				} break;

				case this.exprType.NEW:
				{
					this.resolveNew(node.value);
				} break;

				default: 
				{
					node.value = this.resolveValue(node.value);

					if(exprType === this.exprType.FUNCTION)
					{
						if(this.refVar) 
						{

						}
					}
				} break;
			}	
		}

		if(!this.refNew) {
			throw "redefinition";
		}

		this.refVarBuffer[this.refName] = node.value ? node.value : null;
	},

	resolveValue: function(node)
	{
		var exprType = node.exprType;
		switch(exprType) 
		{
			case this.exprType.FUNCTION:
				this.resolveFunc(node);
				break;
			case this.exprType.FUNCTION_CALL:
				break;

			case this.exprType.BINARY:
				node = this.resolveBinary(node);
				break;
			case this.exprType.UNARY:
				break;

			case this.exprType.MEMBER:
				node = this.resolveMember(node);
				break;

			case this.exprType.THIS:
				break;

			case this.exprType.NEW:
				break;
				
			case this.exprType.OBJECT:
				node = this.resolveObj(node);
				break;

			case this.exprType.IDENTIFIER:
				this.resolveId(node);
				break;

			case this.exprType.NUMBER:
			case this.exprType.BOOL:
			case this.exprType.STRING:
			case this.exprType.NULL:
			case this.exprType.ARRAY:
				break;

			default:
				throw "unresolved";
		}

		return node;	
	},

	resolveId: function(node)
	{
		this.resolveName(node);

		if(this.refNew) {
			throw "ReferenceError: \"" + this.refName + "\" is not defined";
		}

		var expr = this.refVarBuffer[this.refName];
		return expr;
	},

	resolveBinary: function(node)
	{
		return dopple.optimizer.do(node);
	},

	resolveName: function(node)
	{
		this.refPrototype = false;
		this.refThis = false;
		this.refVarBuffer = this.scope.vars;

		this._resolveName(node);
	},

	_resolveName: function(node)
	{
		switch(node.exprType)
		{
			case this.exprType.IDENTIFIER:
			{
				this.resolveRootScope(node);
				this.refName = node.value;
			} break;

			case this.exprType.MEMBER:
			{
				this._resolveName(node.left);
				
				if(this.refNew && !this.refThis) {
					throw "ReferenceError: \"" + this.refName + "\" is not defined";
				}

				this.resolveMemberScope(node.right);
			} break;

			case this.exprType.THIS:
			{
				this.refScope = this.scope;
				this.refThis = true;
			} break;

			// case this.exprType.SUBSCRIPT:
			// {
			// 	return;
			// } break;

			default:
				throw "error";
		}
	},

	resolveMemberScope: function(node)
	{
		if(node.exprType === this.exprType.REFERENCE) {
			this.refExpr = this.refScope[node.name];
			this.refName = node.name;
		}
		else if(node.exprType === this.exprType.MEMBER)
		{
			throw "member"
		}
		else if(node.exprType === this.exprType.STRING) 
		{
			if(node.value === "prototype") {
				this.refPrototype = true;
				return;
			}

			this.refName = node.value;

			if(this.refThis) {
				this.refVarBuffer = this.refScope.staticVars;
			}
			else {
				this.refVarBuffer = this.refScope.vars;
			}

			if(this.refVarBuffer[this.refName]) {
				this.refNew = true;
			}
			else {
				this.refNew = false;
			}
		}
		else {
			throw "NOT IMPLEMENTED";
		}
	},

	resolveRootScope: function(node)
	{
		var scope = this.scope;
		var value = node.value;
		var expr;

		do
		{
			expr = scope.vars[value];
			if(expr) 
			{
				// TODO: possibly needing?
				// if(!expr.scope) {
				// 	throw "error";
				// }
				// scope = expr.scope;
				break;
			}

			scope = scope.parent;
		} while(scope);

		if(!scope) {
			scope = this.globalScope;
			this.refNew = true;
		}
		else {
			this.refNew = false;
		}

		this.refScope = scope;
	},

	resolveAssign: function(node)
	{
		if(node.op === "=") {
			this.resolveName(node.left);
		}

		var prevScope = this.scope;
		this.scope = this.refScope;

		node.right = this.resolveValue(node.right);

		var prevVar = this.refVarBuffer[this.refName];
		if(prevVar && this.refPrototype) 
		{
			if(prevVar.exprType === this.exprType.FUNCTION) {
				this.createClsFromFunc(node, prevVar);
			}
			else {
				throw "error";
			}
		}
		else 
		{
			this.refVarBuffer[this.refName] = node.right;
		}

		this.scope = prevScope;

		// var prevScope = this.scope;

		// var name = this.setupParentScope(node.lhs);


		

		// var varExpr = this.scope.vars[name];
		// if(!varExpr) {
		// 	varExpr = new dopple.AST.Var(name, node.rhs);
		// 	this.scope.vars[name] = varExpr;
		// }

		// var refExpr;
		// var rhsExprType = node.rhs.exprType;
		// switch(rhsExprType)
		// {
		// 	case this.exprType.NUMBER:
		// 	{
		// 		if(varExpr.type)
		// 		{

		// 		}

		// 		varExpr.value = node.rhs.value;

		// 		if(!varExpr) {
		// 			varExpr = new dopple.AST.Var(name, node.rhs.value);
		// 			varExpr.type = node.rhs.type;
		// 			this.scope.vars[name] = refExpr;
		// 		}
		// 		else
		// 		{
		// 			if(varExpr.type !== node.rhs.type) {
						// throw "Type Redefinition: " + name + " expected [" + varExpr.type.name + 
						// 	"] but got [" + node.rhs.type.name + "]"; 
		// 			}

		// 			varExpr.value = node.rhs.value;
		// 		}
		// 	} break;

		// 	case this.exprType.OBJECT:
		// 	{
		// 		var type = dopple.extern.addType(name, this.subType.CLASS, null);
		// 		type.scope = node.rhs.scope;

		// 		// convert from function to class:
		// 		if(varExpr)
		// 		{
		// 		   if(varExpr.exprType === this.exprType.REFERENCE && 
		// 			  varExpr.value && varExpr.value.exprType === this.exprType.FUNCTION)
		// 			{
		// 				var funcBody = varExpr.value.scope.body;
		// 				type.scope.body.concat(funcBody);
		// 			}
		// 			else {
		// 				throw "Redefinition: \"" + name + "\" is already defined in this scope";
		// 			}
		// 		}

		// 		refExpr = new dopple.AST.Reference(null, type);
		// 		this.scope.vars[name] = refExpr;
		// 	} break;

		// 	case this.exprType.FUNCTION:
		// 	{
		// 		refExpr = new dopple.AST.Reference(null, node.rhs.type, node.rhs);
		// 		this.scope.vars[name] = refExpr;
		// 	} break;

		// 	case this.exprType.NEW:
		// 	{
		// 		if(!varExpr)
		// 		{
		// 			if(varExpr.type && varExpr.type.subType !== this.subType.OBJECT) 
		// 			{
		// 				throw "Type Redefinition: " + name + " expected [" + varExpr.type.name + 
		// 					"] but got [" + node.rhs.type.name + "]"; 
		// 			}

		// 			var newExpr = this.resolveNew(node.rhs);
		// 			if(newExpr.type !== varExpr.type && varExpr.type !== this.typesMap.object) 
		// 			{
		// 				throw "Type Redefinition: " + name + " expected [" + varExpr.type.name + 
		// 					"] but got [" + newExpr.type + "]"; 
		// 			}

		// 			varExpr.type = varExpr.type;
		// 			varExpr.value = newExpr;	
		// 		}
		// 		else
		// 		{

		// 		}

		// 		console.log("todo new")
		// 	} break;

		// 	default:
		// 		console.log("todo");
		// 		break;
		// }

		
		//this.scope = prevScope;
	},

	resolveEqualsAssign: function(node)
	{
		this.resolveRefScope(node.lhs);
		console.log("equals_assign", node.lhs);

		this.resolveRefs(node.lhs);
		node.rhs = dopple.optimizer.do(node.rhs);

		// var value = node.value;
		// switch(value.exprType)
		// {
		// 	case this.exprType.OBJECT:
		// 		this.resolveObj(value);
		// 		break;
		// }

		// node.type = node.value.type;

		// this.scope.vars[node.name] = node;
	},

	resolveSetter: function(node)
	{
		var expr = this.scope.vars[node.name.value];

		// if there is already defined expr with such name:
		if(expr)
		{	
			if(expr.exprType !== this.exprType.SETTER_GETTER) {
				throw "Redefinition: \"" + node.name.value + "\" is already defined in this scope";
			}

			expr.setter = node;
		}
		else
		{
			var setGetExpr = new dopple.AST.SetterGetter(node.name.value, node, null);
			this.scope.vars[node.name.value] = setGetExpr;
		}
	},

	resolveGetter: function(node)
	{
		var expr = this.scope.vars[node.name.value];

		// if there is already defined expr with such name:
		if(expr)
		{	
			if(expr.exprType !== this.exprType.SETTER_GETTER) {
				throw "Redefinition: \"" + node.name.value + "\" is already defined in this scope";
			}

			expr.getter = node;
		}
		else
		{
			var setGetExpr = new dopple.AST.SetterGetter(node.name.value, null, node);
			this.scope.vars[node.name.value] = setGetExpr;
		}
	},

	resolveFunc: function(node)
	{
		if(node.name)
		{
			if(this.scope.vars[node.name]) {
				throw "redefinition";
			}

			this.scope.vars[node.name] = node;
		}

		var prevScope = this.scope;
		this.scope = node.scope;
		this.resolveBody(node.scope.body);
		this.scope = prevScope;

		return node;
	},

	resolveFuncCall: function(node)
	{
		this.resolveName(node.name);
		if(this.refNew) {
			throw "ReferenceError: \"" + this.refName + "\" is not defined";
		}

		var args = node.args;
		var numArgs = args.length;
		for(var n = 0; n < numArgs; n++) {
			args[n] = this.resolveValue(args[n]);
		}

		var func = this.refVarBuffer[this.refName];

		var numParams = func.params.length;
		if(numParams !== numArgs) {
			throw "ParamError: Function \"" + this.refName + "\" is supporting " + numParams + " not " + numArgs + " arguments";
		}
	},

	resolveMember: function(node)
	{
		this.resolveName(node);

		if(!this.refNew) {
			throw "undefined";
		}

		var expr = this.refVarBuffer[this.refName];
		return expr;
	},

	resolveNew: function(node)
	{
		this.resolveName(node.nameExpr);

		var expr = this.refVarBuffer[this.refName];

		// TODO: temporary check
		if(expr)
		{
			if(expr.exprType === this.exprType.FUNCTION) {
				this.createClsFromFunc(node, expr);
			}	
		}


		return node;
	},

	createClsFromFunc: function(node, constrFunc)
	{
		var cls = dopple.extern.createCls(this.refName, node.right);
		cls.constrFunc = constrFunc;
		this.refVarBuffer[this.refName] = cls;	

		cls.scope.vars = constrFunc.scope.staticVars;
		cls.scope.staticVars = constrFunc.scope.staticVars;

		return cls;
	},

	resolveObjAsCls: function(node)
	{
		var clsExpr = dopple.extern.createType(this.refName, dopple.SubType.CLASS, null, node.value.scope);
		clsExpr.cls = clsExpr;
		this.refScope.vars[this.refName] = clsExpr;
		
		// if(this.refVar)
		// {
		// 	if(this.refVar.type !== this.typesMap.function) {
		// 		throw "Type Redefinition: " + this.refName + " expected [function] but got [" + node.rhs.type.name + "]"; 
		// 	}
		// }
	
		this.resolveScope(clsExpr.scope);
	},

	resolveCls: function(node)
	{
		this.resolveName(node.name);
		this.resolveScope(node.scope);
				
		node.id = this.types.length;
		node.cls = node;
		this.refScope.vars[this.refName] = node;
		this.types.push(this.refName);
		

		// var expr, name;
		// var scope = this.globalScope;
		// var path = node.name.split(".");
		// var num = path.length - 1;
		// for(var n = 0; n < num; n++)
		// {
		// 	name = path[n];
		// 	expr = scope.vars[name];
		// 	if(!expr) {
		// 		var objScope = new dopple.Scope(scope);
		// 		var objExpr = new dopple.AST.Object(objScope);
		// 		expr = new dopple.AST.Var(name, objExpr);
		// 		scope.vars[name] = expr;
		// 	}

		// 	scope = expr.value.scope;
		// }

		// name = path[num];
		// expr = scope.vars[name];
		// if(expr) {
		// 	throw "Redefinition: \"" + node.name + "\" is already defined in this scope";
		// }

		// scope.vars[name] = node;
	},

	resolveObj: function(node) 
	{
		var prevScope = this.scope;
		this.scope = node.scope;

		var funcs = [];
		var staticVars = this.scope.staticVars;

		var item;
		var body = this.scope.body;
		var num = body.length;
		for(var n = 0; n < num; n++) 
		{
			item = body[n];

			switch(item.exprType)
			{
				case this.exprType.OBJECT_PROPERTY:
				{
					// resolve functions later:
					if(item.value.exprType === this.exprType.FUNCTION) {
						funcs.push(item);
					}
					else {
						this.resolveObjProp(item);
					}
				} break;

				case this.exprType.SETTER:
					this.resolveSetter(item);
					break;

				case this.exprType.GETTER:
					this.resolveGetter(item);
					break;

				default:
					throw "unhandled";
			}
		}

		// resolve functions:
		var funcProp, name;
		num = funcs.length;
		for(n = 0; n < num; n++) 
		{
			funcProp = funcs[n];
			funcProp.value.scope.staticVars = staticVars;

			name = funcProp.key.value;
			if(this.scope.vars[name]) {
				throw "redefinition";
			}			

			this.resolveFunc(funcProp.value);

			this.scope.vars[name] = funcProp.value;
		}

		this.scope = prevScope;
	},

	resolveObjProp: function(node)
	{
		var name = node.key.value;
		if(this.scope.vars[name]) {
			throw "redefinition";
		}

		node.value = this.resolveValue(node.value);

		this.scope.vars[name] = node.value;
	},

	resolveScope: function(scope)
	{
		var rootScope = this.scope;
		this.scope = scope;

		this.resolveBody(this.scope.body);

		this.scope = rootScope;
	},

	setupParentScope: function(node)
	{
		if(node.valueExpr.exprType !== this.exprType.MEMBER) 
		{
			var expr;
			var name = node.valueExpr.name;

			// Find the right scope:
			var scope = this.scope;
			for(;;)
			{
				expr = scope.vars[name];
				if(expr) {
					this.scope = scope;
					break;
				}

				scope = scope.parent;
				if(!scope) {
					throw "ReferenceError: " + name + " is not defined";
				}
			}

			this.scope = expr.value.scope;

			return node.nameExpr.name;
		}
		else 
		{
			var name = this.setupParentScope(node.valueExpr);
			if(node.nameExpr.name === "prototype") {
				return name;
			}

			var expr = this.scope.vars[name];
			if(!expr) {
				throw "ReferenceError: " + name + " is not defined";
			}

			var exprType = expr.exprType;
			if(exprType === this.exprType.CLASS) {
				this.scope = expr.scope;
			}
			else if(exprType === this.exprType.REFERENCE) {
				this.scope = expr.type.scope;
			}
			else {
				this.scope = expr.value.scope;
			}
			
			return name;
		}
	},

	//
	scope: null,
	globalScope: null,

	refName: null,
	refScope: null,
	refExpr: null,
	refNew: null,
	refVarBuffer: null,
	refPrototype: false,
	refThis: false,

	types: dopple.types,
	exprType: dopple.ExprType,
	subType: dopple.SubType
};
