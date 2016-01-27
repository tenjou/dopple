"use strict";

dopple.resolver = 
{
	resolve: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;

		dopple.extern.loadPrimitives();

		// try {
		 	this.resolveBody(scope.bodyFuncs, scope.body);
		// }
		// catch(error) {
		// 	console.error(error);
		// }
	},

	resolveBody: function(bodyFuncs, body)
	{
		var func;
		var num = bodyFuncs.length;
		for(var n = 0; n < num; n++)
		{
			func = bodyFuncs[n];
			this.resolveFunc(func);
		}

		var node;
		var num = body.length;
		for(n = 0; n < num; n++)
		{
			node = body[n];
			if(!node) { continue; }

			switch(node.exprType)
			{
				case this.exprType.VAR:
					this.resolveVar(node);
					break;

				case this.exprType.STRING:
				case this.exprType.NUMBER:
					body[n] = null;
					break;

				case this.exprType.FUNCTION_CALL:
					this.resolveFuncCall(node);
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

				case this.exprType.NEW:
					this.resolveNew(node);
					break;

				// case this.exprType.MEMBER:
				// 	this.resolveMember(node);
				// 	break;

				case this.exprType.RETURN:
					this.resolveReturn(node);
					break;

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
				this.resolveNew(node);
				break;
				
			case this.exprType.OBJECT:
				this.resolveObj(node);
				break;

			case this.exprType.IDENTIFIER:
				node = this.resolveId(node);
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
		else if(node.exprType === this.exprType.IDENTIFIER) 
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
				this.refNew = false;
			}
			else {
				this.refNew = true;
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

		var name = this.refName;
		var varBuffer = this.refVarBuffer;
		var isNew = this.refNew;
		var isPrototype = this.refPrototype;
		var isThis = this.refThis;

		node.right = this.resolveValue(node.right);

		var prevScope = this.scope;
		this.scope = this.refScope;
		
		if(isNew) 
		{
			if(isThis) {
				varBuffer[name] = new dopple.AST.Null();
			}
			else {
				varBuffer[name] = node.right;
			}
		}
		else 
		{
			if(isPrototype)
			{
				var expr = varBuffer[name];

				if(expr.exprType === this.exprType.FUNCTION) {
					this.createClsFromFunc(node, expr);
				}
				else {
					throw "error";
				}
			}
		}

		this.scope = prevScope;
	},

	resolveEqualsAssign: function(node)
	{
		this.resolveRefScope(node.lhs);
		console.log("equals_assign", node.lhs);

		this.resolveRefs(node.lhs);
		node.rhs = dopple.optimizer.do(node.rhs);
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

	resolveReturn: function(node)
	{
		if(node.value) {
			node.value = this.resolveValue(node.value);
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

		this.resolveParams(node.params);
		this.resolveScope(node.scope);

		this.scope = prevScope;

		return node;
	},

	resolveParams: function(params)
	{
		var param;
		var num = params.length;
		for(var n = 0; n < num; n++)
		{
			param = params[n];
			this.scope.vars[param.name] = param;
		}
	},

	resolveFuncCall: function(node)
	{
		this.resolveName(node.name);
		if(this.refNew) {
			throw "ReferenceError: \"" + this.refName + "\" is not defined";
		}

		var func = this.refVarBuffer[this.refName];

		var args = node.args;
		var numArgs = args.length;
		for(var n = 0; n < numArgs; n++) {
			args[n] = this.resolveValue(args[n]);
		}

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
		this.resolveName(node.name);

		if(this.refNew) {
			throw "ReferenceError: \"" + this.refName + "\" is not defined";
		}

		var cls;
		var expr = this.refVarBuffer[this.refName];
		if(expr)
		{
			switch(expr.exprType)
			{
				case this.exprType.CLASS:
				{
					cls = expr;
				} break;
					
				case this.exprType.FUNCTION:
				{
					cls = this.createClsFromFunc(node, expr);
				} break;

				default:
					throw "unhandled";
			}
		}

		var numParams = cls.constrFunc.params.length;
		var numArgs = node.args.length;

		if(numParams !== numArgs) 
		{
			throw "ReferenceError: Class \"" + this.refName + "\" constructor only takes " + 
				numParams + " arguments but passed " + numArgs;
		}

		return node;
	},

	createClsFromFunc: function(node, constrFunc)
	{
		var cls = dopple.extern.createCls(this.refName, node.right);
		cls.constrFunc = constrFunc;
		this.refVarBuffer[this.refName] = cls;

		var clsVars = cls.scope.vars;
		var constrVars = constrFunc.scope.staticVars;

		var varNode, constrVarNode;
		for(var key in constrVars) 
		{
			varNode = clsVars[key];
			if(varNode) {
				constrVars[key].flags &= ~dopple.Flag.DEF;
			}
			else {
				constrVarNode = constrVars[key];
				constrVarNode.flags |= dopple.Flag.DEF;
				clsVars[key] = constrVarNode;
			}
		}

		constrFunc.scope.staticVars = clsVars;
		cls.scope.staticVars = clsVars;

		this.hideDef(constrFunc.scope);

		node.flags |= dopple.Flag.HIDDEN;
		constrFunc.flags |= dopple.Flag.HIDDEN;
		this.scope.bodyCls.push(cls);

		return cls;
	},

	hideDef: function(scope)
	{
		var node;
		var body = scope.body;
		var num = body.length;
		for(var n = 0; n < num; n++)
		{
			node = body[n];
			if(!node) { continue; }

			if(node.exprType === this.exprType.ASSIGN) 
			{
				if(node.right.flags & dopple.Flag.DEF) {
					body[n] = null;
				}
			}
		}
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

		this.resolveBody(scope.bodyFuncs, scope.body);

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
	refNew: false,
	refVarBuffer: null,
	refPrototype: false,
	refThis: false,

	types: dopple.types,
	exprType: dopple.ExprType,
	subType: dopple.SubType
};
