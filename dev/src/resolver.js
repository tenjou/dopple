"use strict";

dopple.resolver = 
{
	resolve: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;
		scope.protoVars = this.globalScope.vars;

		dopple.extern.loadPrimitives();

		// try {
		 	this.resolveBody(scope);
		 	this.resolveBodyFuncs(scope);
		// }
		// catch(error) {
		// 	console.error(error);
		// }
	},

	resolveBody: function(scope)
	{
		var node;
		var body = scope.body;
		var num = body.length;
		for(var n = 0; n < num; n++)
		{
			node = body[n];
			if(!node) { continue; }

			switch(node.exprType)
			{
				case this.exprType.VAR:
					body[n] = this.resolveVar(node);
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
					body[n] = this.resolveAssign(node);
					break;

				case this.exprType.IF:
					this.resolveIf(node);
					break;

				// case this.exprType.SETTER:
				// 	this.resolveSetter(node);
				// 	break;
				// case this.exprType.GETTER:
				// 	this.resolveGetter(node);
				// 	break;

				case this.exprType.NEW:
					this.resolveNew(node);
					break;

				// case this.exprType.MEMBER:
				// 	this.resolveMember(node);
				// 	break;

				case this.exprType.RETURN:
					this.resolveReturn(node);
					break;

				case this.exprType.FUNCTION:
					body[n] = this.resolveFunc(node, true);
					break;					

				case this.exprType.CLASS:
					this.resolveCls(node);
					break;
			}
		}
	},

	resolveBodyFuncs: function(scope)
	{
		var prevScope = this.scope;
		this.scope = scope;

		var node;
		var vars = scope.protoVars;
		for(var key in vars)
		{
			node = vars[key];
			if(node.flags & dopple.Flag.RESOLVED) { continue; }

			if(node.exprType === this.exprType.FUNCTION) {
				this.resolveFuncBody(node);
			}
			else if(node.exprType === this.exprType.SETTER_GETTER)
			{
				if(node.setter) {
					this.resolveScope(node.setter.value.scope);
				}
				if(node.getter) {
					this.resolveScope(node.getter.value.scope);
				}
			}
			else if(node.exprType === this.exprType.OBJECT) {
				this.resolveBodyFuncs(node.scope);
			}
			else if(node.exprType === this.exprType.CLASS) {
				this.resolveClsBody(node);
			}
		}

		this.scope = prevScope;
	},

	resolveVar: function(node)
	{
		var name = node.ref.name.value;
		var expr = this.scope.vars[name];

		var value;
		if(node.ref.value)
		{
			var value = node.ref.value;
			if(value) {
				value = this.resolveValue(node.ref.value);
			}

			this.scope.vars[name] = value;

			if(value.exprType === this.exprType.FUNCTION)
			{
				value.name = name;
				this.scope.bodyFuncs.push(value);
				return null;
			}
		}
		else {
			this.scope.vars[name] = expr;
		}

		return null;
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
				this.resolveFunc(node, false);
				break;
			case this.exprType.FUNCTION_CALL:
				break;

			case this.exprType.BINARY:
				node = this.resolveBinary(node);
				break;
			case this.exprType.UNARY:
				break;
			case this.exprType.LOGICAL:
				this.resolveLogical(node);
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

		var expr = new dopple.AST.Reference(node, this.refVarBuffer[this.refName]);
		return expr;
	},

	resolveMember: function(node)
	{
		this.resolveName(node);

		if(this.refNew) {
			throw "ReferenceError: \"" + this.refName + "\" is not defined";
		}

		var expr;
		if(this.refParentExpr.exprType !== this.exprType.REFERENCE) {
			expr = new dopple.AST.Reference(node, this.refParentExpr);
		}
		else {
			expr = this.refParentExpr;
		}

		return expr;
	},	

	resolveBinary: function(node)
	{
		return dopple.optimizer.do(node);
	},

	resolveLogical: function(node)
	{
		node.lhs = this.resolveValue(node.lhs);
		node.rhs = this.resolveValue(node.rhs);
	},

	resolveName: function(node)
	{
		this.refVarBuffer = this.scope.vars;
		this.refParentExpr = null;
		this.refNew = false;
		this._resolveName_depth = 0;
		this._resolveName_num = 0;

		this._resolveName(node);
	},

	_resolveName: function(node)
	{
		this._resolveName_depth++;

		switch(node.exprType)
		{
			case this.exprType.IDENTIFIER:
			{
				this.refName = node.value;

				if(this._resolveName_num === 0) 
				{
					this._resolveRootScope(node);

					if(this._resolveName_depth === 1) {
						this._resolveExprScope();
					}
				}
				else
				{
					if(this.refName === "prototype") {
						this.refVarBuffer = this.refScope.protoVars;
					}
				}
			} break;

			case this.exprType.MEMBER:
			{
				if(node.left.exprType === this.exprType.THIS)
				{
					if(this._resolveName_num === 0) 
					{
						this.refScope = this.scope;
						this.refVarBuffer = this.scope.protoVars;
					}
					else {
						throw "Unexpected: This expression";
					}

					this._resolveName_num++;
				}
				else
				{
					this._resolveName(node.left);

					if(node.left.exprType !== this.exprType.MEMBER) {
						this._resolveExprScope();
					}
					
					if(this.refNew) {
						throw "ReferenceError: \"" + this.refName + "\" is not defined";
					}			
				}

				this._resolveName(node.right);
				this._resolveExprScope();
			} break;

			default:
				throw "unandled";
		}

		this._resolveName_num++;
		this._resolveName_depth--;
	},

	_resolveExprScope: function()
	{
		var expr;
		if(this.refName === "prototype") {
			expr = this.refParentExpr;
		}
		else 
		{
			expr = this.refVarBuffer[this.refName];
			if(expr) {
				this.refNew = false;
			}
			else {
				this.refNew = true;
				return;
			}				
		}

		if(expr.exprType === this.exprType.REFERENCE) {
			expr = expr.value;
		}

		if(this.refName !== "prototype") {
			this.refParentExpr = expr;
			this.resolved.holderScope = this.refScope;
		}

		this.refScope = expr.scope;
	
		if(expr.exprType === this.exprType.OBJECT) 
		{
			if(this.refName === "prototype") {
				throw "Cannot set property \"" + this.refName + "\" of undefined";
			}

			this.refVarBuffer = this.refScope.protoVars;
		}
		else if(expr.exprType === this.exprType.INSTANCE) 
		{
			if(this.refName === "prototype") {
				throw "Cannot set property \"" + this.refName + "\" of undefined";
			}

			this.refScope = expr.cls.scope;
			this.refVarBuffer = expr.cls.scope.protoVars;
		}
		else if(expr.exprType === this.exprType.FUNCTION)
		{
			if(this.refName === "prototype") {
				this.refVarBuffer = this.refScope.protoVars;
			}
			else {
				this.refVarBuffer = this.refScope.staticVars;
			}
		}
	},

	_resolveRootScope: function(node)
	{
		var scope = this.scope;
		var value = node.value;
		var expr;

		do
		{
			expr = scope.vars[value];
			if(expr) {
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
		this.refVarBuffer = scope.staticVars;
		this.resolved.holderScope = scope;
	},	

	resolveAssign: function(node)
	{
		var value = this.resolveValue(node.right);
		var valueExpr = value.exprType;
		node.right = value;

		if(node.op === "=") {
			this.resolveName(node.left);
		}

		var returnNode = node;

		if(this.refNew) 
		{
			if(this.refParentExpr)
			{
				var parentExprType = this.refParentExpr.exprType;

				if(parentExprType === this.exprType.OBJECT) 
				{
					returnNode = null;

					if(valueExpr === this.exprType.FUNCTION) {
						value.scope.owner = this.refParentExpr.scope;
					}

					this.refVarBuffer[this.refName] = value;
				}
				else if(parentExprType === this.exprType.CLASS) {
					returnNode = this._resolveAssign_Class(node);
				}
				else {
					this.refVarBuffer[this.refName] = value;
				}
			}
			// THIS
			else {
				returnNode = this._resolveAssign_Class(node);
			}
		}
		else 
		{
			if(this.refName === "prototype")
			{
				if(this.refParentExpr.exprType === this.exprType.FUNCTION) {
					returnNode = null;
					this.createClsFromFunc(node, this.refParentExpr);
				}
				else {
					throw "unhandled";
				}
			}
			else
			{
				// TODO: typechecks
			}
		}

		return returnNode;
	},

	_resolveAssign_Class: function(node)
	{
		var value = node.right;
		var valueExpr = value.exprType;

		if((this.insideFunc === 0) && valueExpr !== this.exprType.REFERENCE && value.cls.flags & dopple.Flag.SIMPLE)
		{
			this.refVarBuffer[this.refName] = value;
			return null;
		}
		else
		{
			if(valueExpr === this.exprType.REFERENCE) {
				this.refVarBuffer[this.refName] = new value.value.cls.ast();
			}
			else if(valueExpr === this.exprType.CLASS) {
				throw "unhandled";
			}
			else {
				this.refVarBuffer[this.refName] = new value.cls.ast();	
			}
		}

		return node;
	},

	resolveIf: function(node)
	{
		this.resolveBranch(node.branchIf);
	},

	resolveBranch: function(node)
	{
		this.resolveValue(node.value);
		this.resolveScope(node.scope);
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

		var prevScope = this.scope;
		this.scope = node.value.scope;

		this.resolveParams(node.value.params);

		this.scope = prevScope;

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

	resolveFunc: function(node, notValue)
	{
		var prevScope = this.scope;
		this.scope = node.scope;

		if(node.params) {
			this.resolveParams(node.params);
		}

		this.scope = prevScope;

		node.scope.protoVars = this.scope.protoVars;

		if(notValue) 
		{
			if(node.name)
			{
				if(this.scope.vars[node.name]) {
					throw "redefinition";
				}

				this.scope.vars[node.name] = node;
			}

			this.scope.bodyFuncs.push(node);	
			return null;
		}

		return node;
	},

	resolveFuncBody: function(node)
	{
		if(node.flags & dopple.Flag.RESOLVED) { return; }

		if((node.flags & dopple.Flag.CONSTRUCTOR) === 0) {
			this.insideFunc++;
		}
		
		this.resolveScope(node.scope);

		if((node.flags & dopple.Flag.CONSTRUCTOR) === 0) {
			this.insideFunc--;
		}

		node.flags |= dopple.Flag.RESOLVED;
	},

	resolveParams: function(params)
	{
		var param;
		var num = params.length;
		for(var n = 0; n < num; n++)
		{
			param = params[n];
			param.flags |= dopple.Flag.PARAM;
			this.scope.vars[param.name.value] = param;
		}
	},

	resolveFuncCall: function(node)
	{
		this.resolveName(node.name);
		if(this.refNew) {
			throw "ReferenceError: \"" + this.refName + "\" is not defined";
		}

		var func = this.refParentExpr;
		if(func.exprType !== this.exprType.FUNCTION) {
			throw "ConstructorError: Invalid constructor call of \"" + this.refName + "\"";
		}

		func.calls++;

		var args = node.args;
		var numArgs = args.length;
		for(var n = 0; n < numArgs; n++) {
			args[n] = this.resolveValue(args[n]);
		}

		var numParams = func.params ? func.params.length : 0;
		if(numParams !== numArgs) {
			throw "ParamError: Function \"" + this.refName + "\" supports " + numParams + " arguments but passed " + numArgs;
		}

		this.resolveFuncBody(func);
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
		var nameBuffer = this.genNameBuffer(node.left);
		var name = nameBuffer[nameBuffer.length - 1];

		constrFunc.flags |= dopple.Flag.CONSTRUCTOR | dopple.Flag.HIDDEN;
		if(constrFunc.calls > 0) {
			throw "ConstructorError: Calling constructor of \"" + name + "\" before it's body is defined."
		}

		var constrScope = constrFunc.scope;
		var scope = node.right.scope;

		var cls = dopple.extern.createCls(name, scope);
		cls.constrFunc = constrFunc;
		cls.nameBuffer = nameBuffer;
		this.resolved.holderScope.protoVars[name] = cls;
		this.resolved.holderScope.bodyCls.push(cls);

		var clsVars = scope.protoVars;
		var constrVars = constrScope.protoVars;
		constrScope.protoVars = clsVars;

		cls.flags |= dopple.Flag.HIDDEN;
		node.flags |= dopple.Flag.HIDDEN;
	},

	genNameBuffer: function(node)
	{
		var buffer = [];

		this._genNameBuffer(buffer, node);

		return buffer;
	},

	_genNameBuffer: function(buffer, node)
	{
		if(node.exprType === this.exprType.IDENTIFIER) 
		{
			if(node.value !== "prototype") {
				buffer.push(node.value);
			}
		}
		else if(node.exprType === this.exprType.MEMBER)
		{
			this._genNameBuffer(buffer, node.left);
			this._genNameBuffer(buffer, node.right);
		}
		else if(node.exprType === this.exprType.THIS) {
			buffer.push("this");
		}
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

	// resolveObjAsCls: function(node)
	// {
	// 	var clsExpr = dopple.extern.createType(this.refName, dopple.SubType.CLASS, null, node.value.scope);
	// 	clsExpr.cls = clsExpr;
	// 	this.refScope.vars[this.refName] = clsExpr;
	
	// 	this.resolveScope(clsExpr.scope);
	// },

	resolveCls: function(node)
	{
		this.resolveScope(node.scope);
				
		node.id = this.types.length;
		node.cls = node;
		this.scope.vars[node.name] = node;
		this.types.push(node.name);
	},

	resolveClsBody: function(node)
	{
		if(node.flags & dopple.Flag.RESOLVED) { return; }

		var func = node.constrFunc;
		if(func) 
		{
			this.resolveFuncBody(func);
			func.scope.protoVars = node.scope.protoVars;
		}
		
		this.resolveBodyFuncs(node.scope);		

		node.flags |= dopple.Flag.RESOLVED;
	},

	resolveObj: function(node) 
	{
		var prevScope = this.scope;
		this.scope = node.scope;

		var protoVars = this.scope.protoVars;

		var item;
		var body = this.scope.body;
		var num = body.length;
		for(var n = 0; n < num; n++) 
		{
			item = body[n];

			switch(item.exprType)
			{
				case this.exprType.OBJECT_PROPERTY:
					this.resolveObjProp(item);
					break;

				case this.exprType.SETTER:
				case this.exprType.GETTER:
					funcs.push(item);
					break;

				default:
					throw "unhandled";
			}
		}

		this.scope = prevScope;
	},

	resolveObjProp: function(node)
	{
		var name = node.key.value;
		if(this.scope.protoVars[name]) {
			throw "redefinition";
		}

		node.value = this.resolveValue(node.value);

		this.scope.protoVars[name] = node.value;
	},

	resolveScope: function(scope)
	{
		var rootScope = this.scope;
		this.scope = scope;

		this.resolveBody(scope);

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
	refParentExpr: null,

	resolved: {
		holderScope: null,
	},

	_resolveName_depth: 0,
	_resolveName_num: 0,

	insideFunc: 0,

	types: dopple.types,
	exprType: dopple.ExprType,
	subType: dopple.SubType
};
