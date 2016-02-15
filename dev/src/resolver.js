"use strict";

dopple.resolver = 
{
	resolve: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;
		scope.protoVars = this.globalScope.vars;

		this.nameResolve = new dopple.NameResolveInfo();
		this.tmpResolveBuffer = [];

		dopple.extern.loadPrimitives();

		// try {
		 	this.resolveBody(scope);
		 	this.bodyResolved = true;

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
		var bodyFuncs = scope.bodyFuncs;

		var num = bodyFuncs.length;
		for(var n = 0; n < num; n++) 
		{
			node = bodyFuncs[n];
			this.resolveFunc(node, true);
		}
		
		num = body.length;
		for(n = 0; n < num; n++)
		{
			node = body[n];
			if(!node) { continue; }

			body[n] = this.resolveBodyValue(node);
		}
	},

	resolveBodyValue: function(node)
	{
		switch(node.exprType)
		{
			case this.exprType.VAR:
				return this.resolveVar(node);

			case this.exprType.DECLS:
				this.resolveDecls(node);
				break;

			case this.exprType.STRING:
			case this.exprType.NUMBER:
				return null;

			case this.exprType.FUNCTION_CALL:
				this.resolveFuncCall(node);
				break;

			case this.exprType.OBJECT_PROPERTY:
				this.resolveObjProp(node);
				break;

			case this.exprType.ASSIGN:
				return this.resolveAssign(node);

			case this.exprType.UPDATE:
				return this.resolveUpdate(node);

			case this.exprType.SUBSCRIPT:
				this.resolveSubscript(node);
				break;					

			case this.exprType.IF:
				this.resolveIf(node);
				break;

			case this.exprType.FOR:
				this.resolveFor(node);
				break;

			case this.exprType.WHILE:
				this.resolveWhile(node);
				break;

			case this.exprType.DO_WHILE:
				this.resolveDoWhile(node);
				break;

			case this.exprType.FOR_IN:
				this.resolveForIn(node);
				break;

			case this.exprType.NEW:
				this.resolveNew(node);
				break;

			case this.exprType.MEMBER:
				this.resolveMember(node);
				break;

			case this.exprType.RETURN:
				this.resolveReturn(node);
				break;			

			case this.exprType.CLASS:
				this.resolveCls(node);
				break;

			case this.exprType.FUNCTION:
				break;	

			default:
				throw "unhandled";				
		}	

		return node;	
	},

	resolveBodyFuncs: function(scope)
	{
		var node;
		var bodyFuncs = scope.bodyFuncs;
		var num = bodyFuncs.length;
		for(var n = 0; n < num; n++)
		{
			node = bodyFuncs[n];

			if(node.flags & dopple.Flag.RESOLVED_BODY) { continue; }		

			this.resolveFuncBody(node);
		}
	},

	resolveVar: function(node)
	{
		var name = node.ref.name.value;
		var expr = this.scope.vars[name];
		if(expr) {
			throw "redefinition";
		}

		if(node.value)
		{
			var value = this.resolveValue(node.value);
			node.value = value;

			var valueExprType = value.exprType;
			if(valueExprType === this.exprType.MEMBER) {
				node.ref.type = value.ref.type;
			}
			else {
				node.ref.type = value.type;
			}

			if(valueExprType === this.exprType.FUNCTION)
			{
				node.value.name = name;
				this.scope.vars[name] = node.value;
				return null;
			}
		}

		this.scope.vars[name] = node;

		return node;
	},

	resolveDecls: function(node)
	{
		var decls = node.decls;
		var num = decls.length;
		for(var n = 0; n < num; n++) {
			this.resolveVar(decls[n]);
		}

		return node;
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

		if(!this.nameResolve.isNew) {
			throw "redefinition";
		}

		this.refVarBuffer[this.nameResolve.name] = node.value ? node.value : null;
	},

	resolveValue: function(node)
	{
		var exprType = node.exprType;
		switch(exprType) 
		{
			case this.exprType.IDENTIFIER:
				node = this.resolveId(node);
				break;

			case this.exprType.MEMBER:
				node = this.resolveMember(node);
				break;				

			case this.exprType.BINARY:
				node = this.resolveBinary(node);
				break;
			case this.exprType.UNARY:
				break;
			case this.exprType.LOGICAL:
				this.resolveLogical(node);
				break;

			case this.exprType.THIS:
				break;

			case this.exprType.NEW:
				this.resolveNew(node);
				break;

			case this.exprType.SUBSCRIPT:
				this.resolveSubscript(node);
				break;
				
			case this.exprType.OBJECT:
				node = this.resolveObj(node);
				break;

			case this.exprType.FUNCTION:
				this.resolveFunc(node, false);
				break;

			case this.exprType.FUNCTION_CALL:
			{
				this.resolveFuncCall(node);

				if(node.value.exprType === this.exprType.FUNCTION_CALL) 
				{
					if(!node.value.type.cls)	{
						throw "ReturnError: Called function does not have return value";
					}
				}
			} break;

			case this.exprType.ARRAY:
				this.resolveArray(node);
				break;			

			case this.exprType.NUMBER:
			case this.exprType.BOOL:
			case this.exprType.STRING:
			case this.exprType.NULL:
			case this.exprType.REGEX:
				break;

			default:
				throw "unresolved";
		}

		return node;	
	},

	resolveId: function(node)
	{
		var expr = this.scope.vars[node.value];
		if(!expr) {
			throw "ReferenceError: '" + node.value + "' is not defined";
		}

		node.ref = expr.ref;

		return expr.ref;
	},

	resolveMember: function(node)
	{
		this.resolveName(node);

		if(this.nameResolve.isNew) {
			throw "ReferenceError: '" + this.nameResolve.name + "' is not defined";
		}

		var expr = this.nameResolve.parentExpr;
		if(expr.exprType === this.exprType.VAR) {
			node.ref = expr.ref;
		}
		else {
			node.ref = expr;
		}

		return node;
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

	resolveAssign: function(node)
	{
		var value = this.resolveValue(node.right);
		var valueExpr = value.exprType;
		node.right = value;

		this.resolveName(node.left);

		var returnNode = node;

		var parentExpr = this.nameResolve.parentExpr;
		if(this.nameResolve.isNew) 
		{
			if(parentExpr)
			{
				var type;
				if(parentExpr.exprType === this.exprType.VAR) {
					type = parentExpr.ref.type;
				}
				else {
					type = parentExpr.type;
				}				

				switch(type.subType)
				{
					case this.subType.OBJECT:
					{
						returnNode = null;

						this.nameResolve.varBuffer[this.nameResolve.name] = value
					} break;

					case this.subType.CLASS:
					{
						returnNode = this._resolveAssign_Class(node, value);
					} break;

					default: {
						this.nameResolve.varBuffer[this.nameResolve.name] = value;
					} break;
				}
			}
			else 
			{
				if(this.nameResolve.pointSelf) {
					returnNode = this._resolveAssign_Class(node, value);
				}
				else {
					throw "ReferenceError: '" + this.nameResolve.name + "' is not defined";
				}
			}
		}
		else 
		{
			if(this.nameResolve.name === "prototype")
			{
				if(parentExpr.exprType === this.exprType.FUNCTION) {
					returnNode = null;
					this.createClsFromFunc(node, parentExpr);
				}
				else {
					throw "unhandled";
				}
			}
			else
			{
				var targetExpr;

				if(parentExpr.exprType === this.exprType.VAR) 
				{
					targetExpr = parentExpr.ref;

					parentExpr.ref.ops++;


					// if(this.refParentExpr.ref.exprType === this.exprType.FUNCTION_CALL) 
					// {
					// 	if(!this.refParentExpr.cls)	{
					// 		throw "ReturnError: Called function does not have return value";
					// 	}
					// }		
				}		
				else
				{
					targetExpr = parentExpr;

					// TODO: typechecks
					if(this.nameResolve.pointSelf) {
						
					}
					else
					{

					}
				}

				targetExpr.type = value.type;	
			}
		}

		return returnNode;
	},

	_resolveAssign_Class: function(node, value)
	{
		var valueExpr = value.exprType;

		var type;
		if(value.exprType === this.exprType.MEMBER) {
			type = value.ref.type;
		}
		else {
			type = value.type;
		}

		if((this.insideFunc === 0) && valueExpr !== this.exprType.REFERENCE && value.flags & dopple.Flag.SIMPLE)
		{
			var ref = new dopple.AST.Reference(node.left);
			ref.type = value.type;
			var varExpr = new dopple.AST.Var(ref, value);
			this.nameResolve.varBuffer[this.nameResolve.name] = varExpr;

			return null;
		}
		else
		{
			var expr;

			switch(type.subType)
			{
				case this.subType.NUMBER:
					expr = new dopple.AST.Number();
					break;

				case this.subType.BOOL:
					expr = new dopple.AST.Bool();
					break;					

				case this.subType.STRING:
					expr = new dopple.AST.String();
					break;

				case this.subType.ARRAY:
				case this.subType.OBJECT:
				case this.subType.INSTANCE:
					expr = new dopple.AST.Null();
					break;

				default:
					throw "unhandled";
			}

			var ref = new dopple.AST.Reference(node.left);
			ref.type = type;
			this.nameResolve.varBuffer[this.nameResolve.name] = new dopple.AST.Var(ref, expr);
		}

		return node;
	},

	resolveUpdate: function(node)
	{
		node.value = this.resolveValue(node.value);

		var type = node.value.type;
		if(type.subType !== this.subType.NUMBER) {
			throw "UpdateError: Expected 'Number' but instead got '" + type.cls.name + "'";
		}

		return node;
	},	

	resolveSubscript: function(node)
	{
		node.value = this.resolveValue(node.value);
		node.accessValue = this.resolveValue(node.accessValue);

		var subType = node.value.cls.subType;
		var accessSubType = node.accessValue.cls.subType;

		if(subType === this.subType.ARRAY) 
		{
			if(accessSubType !== this.subType.NUMBER) 
			{
				throw "SubscriptError: Invalid access value type '" + node.accessValue.cls.name 
					+ "' but expected 'Number'";
			}
		}
		else if(subType === this.subType.MAP) 
		{
			if(accessSubType !== this.subType.STRING) 
			{
				throw "SubscriptError: Invalid access value type '" + node.accessValue.cls.name 
					+ "' but expected 'String'";
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
		node.scope.vars = this.scope.vars;
		node.scope.protoVars = this.scope.protoVars;

		this.resolveBodyValue(node.value);
		this.resolveScope(node.scope);
	},

	resolveWhile: function(node)
	{
		node.scope.vars = this.scope.vars;
		node.scope.protoVars = this.scope.protoVars;

		this.resolveBodyValue(node.test);
		this.resolveScope(node.scope);
	},

	resolveForIn: function(node)
	{
		node.scope.vars = this.scope.vars;
		node.scope.protoVars = this.scope.protoVars;

		var leftExprType = node.left.exprType;
		if(leftExprType === this.exprType.DECLS) {
			throw "SyntaxError: Invalid left-hand side in for-in loop: Must have a single binding";
		}
		
		var left;
		if(leftExprType === this.exprType.VAR) {
			left = this.resolveVar(node.left);
		}
		else if(leftExprType === this.exprType.IDENTIFIER) {
			left = this.resolveId(node.left);
		}
		else if(leftExprType === this.exprType.MEMBER) {
			left = this.resolveMember(node.left);
		}
		else {	
			throw "SyntaxError: Invalid left-hand side in for-loop";
		}

		var right = this.resolveValue(node.right);
		left.cls = dopple.extern.typesMap.String;

		this.resolveScope(node.scope);

		return node;
	},

	resolveEqualsAssign: function(node)
	{
		this.resolveRefScope(node.lhs);

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
				throw "Redefinition: '" + node.name.value + "' is already defined in this scope";
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
				throw "Redefinition: '" + node.name.value + "' is already defined in this scope";
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
		if(node.flags & dopple.Flag.RESOLVED) { return; }
		node.flags |= dopple.Flag.RESOLVED;

		if(this.insideObj > 0) {
			node.scope.protoVars = this.scope.protoVars;
		}

		var prevScope = this.scope;
		this.scope = node.scope;

		this.resolveParams(node);

		this.scope = prevScope;	

		if(notValue) 
		{
			if(node.name)
			{
				if(this.scope.vars[node.name]) {
					throw "redefinition";
				}

				this.scope.vars[node.name] = node;
			}
				
			return null;
		}

		if(!this.bodyResolved)
		{
			if(((node.flags & dopple.Flag.HANDLED) === 0) && 
			   ((node.flags & dopple.Flag.EXTERN) === 0)) 
			{
				this.globalScope.bodyFuncs.push(node);
			}
		}
		else {
			this.resolveFuncBody(node);
		}

		return node;
	},

	resolveFuncBody: function(node)
	{
		if(node.flags & dopple.Flag.RESOLVED_BODY) { return; }

		if((node.flags & dopple.Flag.CONSTRUCTOR) === 0) {
			this.insideFunc++;
		}
		
		this.resolveScope(node.scope);

		if((node.flags & dopple.Flag.CONSTRUCTOR) === 0) {
			this.insideFunc--;
		}

		node.flags |= dopple.Flag.RESOLVED_BODY;
	},

	resolveParams: function(func)
	{
		if(!func.params) { return; }

		var param, name;
		var params = func.params;
		var num = params.length;
		for(var n = 0; n < num; n++)
		{
			param = params[n];
			name = param.ref.name.value;

			if(this.scope.vars[name]) {
				throw "redefinition";
			}

			this.scope.vars[name] = new dopple.AST.Var(param.ref.name, param.ref);

			if(param.ref.cls && (param.ref.cls.subType === this.subType.ARGS)) {
				func.argsIndex = n;
			}
		}
	},

	resolveFuncCall: function(node)
	{
		this.resolveName(node.name);
		if(this.nameResolve.isNew) {
			throw "ReferenceError: '" + this.nameResolve.name + "' is not defined";
		}

		var func = this.nameResolve.parentExpr;
		if(func.exprType !== this.exprType.FUNCTION) {
			throw "ConstructorError: Invalid constructor call of '" + this.nameResolve.name + "'";
		}

		func.calls++;

		var args = node.args;
		var numArgs = args.length;
		for(var n = 0; n < numArgs; n++) {
			args[n] = this.resolveValue(args[n]);
		}

		var numParams = func.params ? func.params.length : 0;
		if(numParams !== numArgs) 
		{
			var error = true;

			if(func.argsIndex > -1) 
			{
				if(numArgs > func.argsIndex) {
					error = false;
				}
			}

			if(error) {
				throw "ParamError: Function '" + this.nameResolve.name + "' supports " + numParams + " arguments but passed " + numArgs;
			}
		}

		node.func = func;

		if(func.returnRef) {
			node.type = func.returnRef.type;
		}

		this.resolveFuncBody(func);
	},

	resolveArray: function(node)
	{
		if(!node.elements) { return node; }

		var type = node.type.templateType;

		var element;
		var elements = node.elements;
		var num = elements.length;
		for(var n = 0; n < num; n++)
		{
			element = this.resolveValue(elements[n]);
			if(!type) {
				type = element.type;
			}
			else 
			{
				if(type !== element.type) 
				{
					throw "ArrayType: Incompatible class types, expected 'Array<" + 
						type.name + ">' but got 'Array<" + element.type.name + ">' in one of the elements";
				}
			}
		}

		node.type = node.type.cls.getTemplate(type);

		return node;
	},

	resolveNew: function(node)
	{
		this.resolveName(node.name);

		if(this.nameResolve.isNew) {
			throw "ReferenceError: '" + this.nameResolve.name + "' is not defined";
		}

		var cls;
		var expr = this.nameResolve.varBuffer[this.nameResolve.name];
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
			throw "ReferenceError: Class '" + this.nameResolve.name + "' constructor only takes " + 
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
			throw "ConstructorError: Calling constructor of '" + name + "' before it's body is defined."
		}

		var constrScope = constrFunc.scope;
		var scope = node.right.scope;

		var cls = dopple.extern.createCls(name, scope);
		cls.constrFunc = constrFunc;
		cls.nameBuffer = nameBuffer;
		this.nameResolve.holderScope.protoVars[name] = cls;
		this.nameResolve.holderScope.bodyCls.push(cls);

		var clsVars = scope.protoVars;
		var constrVars = constrScope.protoVars;
		constrScope.protoVars = clsVars;

		node.flags |= dopple.Flag.HIDDEN;

		return cls;
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
		if(node.flags & dopple.Flag.RESOLVED_BODY) { return; }

		var func = node.constrFunc;
		if(func) 
		{
			this.resolveFuncBody(func);
			func.scope.protoVars = node.scope.protoVars;
		}
		
		this.resolveBodyFuncs(node.scope);		

		node.flags |= dopple.Flag.RESOLVED_BODY;
	},

	resolveObj: function(node) 
	{
		this.insideObj++;

		var prevScope = this.scope;
		this.scope = node.scope;

		var item;
		var body = this.scope.body;
		var num = body.length;
		var prevCls = null;
		var clsSimilar = true;
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

				case this.exprType.FUNCTION:
					this.resolveFunc(item);
					break;

				default:
					throw "unhandled";
			}

			if(!prevCls) {
				prevCls = item.cls;
			}
			else 
			{
				if(prevCls !== item.cls) {
					clsSimilar = false;
				}
			}
		}

		this.scope = prevScope;

		if(prevCls)
		{
			if(clsSimilar) 
			{
				if(prevCls.flags & dopple.Flag.SIMPLE) {
					node = new dopple.AST.Enum(node.scope);
				}
				else {
					node = new dopple.AST.Map(node.scope);
				}

				node.templateCls = prevCls;
			}
		}		

		this.insideObj--;

		return node;
	},

	resolveObjProp: function(node)
	{
		var name = node.key.value;
		if(this.scope.protoVars[name]) {
			throw "redefinition";
		}

		node.value = this.resolveValue(node.value);
		if(node.value.exprType === this.exprType.FUNCTION) {
			node.value.scope.protoVars = this.scope.protoVars;
		}

		node.type = node.value.type;
		this.scope.protoVars[name] = node.value;
	},

	resolveObjBody: function(obj)
	{
		this.resolveBodyFuncs(obj.scope);
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
					throw "ReferenceError: '" + name + "' is not defined";
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
				throw "ReferenceError: '" + name + "' is not defined";
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

	resolveName: function(node, nameResolve)
	{
		if(!nameResolve) {
			nameResolve = this.nameResolve;
		}

		this._clearNameResolve(nameResolve);
		this._resolveName(node, nameResolve);
	},

	_clearNameResolve: function(nameResolve)
	{
		nameResolve.name = null;
		nameResolve.scope = null;
		nameResolve.holderScope = null;
		nameResolve.varBuffer = this.scope.vars;
		nameResolve.parentExpr = null;
		nameResolve.numSolved = 0;
		nameResolve.numToSolve = 0;
		nameResolve.isNew = false;
		nameResolve.pointSelf = false;		
	},

	_resolveName: function(node, nameResolve)
	{
		switch(node.exprType)
		{
			case this.exprType.IDENTIFIER:
			{
				nameResolve.name = node.value;

				if(nameResolve.numSolved === 0) {
					this._resolveRootScope(node, nameResolve);
				}
				else
				{
					if(nameResolve.name === "prototype") {
						nameResolve.varBuffer = nameResolve.scope.protoVars;
					}
				}

				this._resolveExprScope(nameResolve);
			} break;

			case this.exprType.MEMBER:
			{
				nameResolve.numToSolve += 2;

				// THIS
				if(node.left.exprType === this.exprType.THIS)
				{
					if(nameResolve.numSolved === 0) 
					{
						nameResolve.scope = this.scope;
						nameResolve.varBuffer = this.scope.protoVars;
						nameResolve.pointSelf = true;
					}
					else {
						throw "Unexpected: This expression";
					}

					nameResolve.numSolved++;
				}
				else
				{
					this._resolveName(node.left, nameResolve);
					nameResolve.numToSolve--;
					
					if(nameResolve.isNew) {
						throw "ReferenceError: '" + nameResolve.name + "' is not defined";
					}			
				}

				this._resolveName(node.right, nameResolve);
				nameResolve.numToSolve--;
			} break;

			case this.exprType.SUBSCRIPT:
			{
				var tmpNameResolve = this.getTmpResolve();

				this.resolveName(node.accessValue, tmpNameResolve);
				if(tmpNameResolve.isNew) {
					throw "ReferenceError: '" + tmpNameResolve.name + "' is not defined";
				}

				var expr = tmpNameResolve.parentExpr;
				if(expr.exprType === this.exprType.VAR) {
					expr = expr.ref;
				}

				if(expr.cls.subType !== this.subType.STRING) 
				{
					throw "UnexpectedType: '" + tmpNameResolve.name + 
						"' should be of String subtype but instead is " + meta.enumToString(dopple.SubType, expr.cls.subType);
				}

				nameResolve.name = node.value.value;
				this._resolveExprScope(nameResolve);

				this.popTmpResolve(tmpNameResolve);
			} break;

			default:
				throw "unandled";
		}

		nameResolve.numSolved++;
	},

	_resolveExprScope: function(nameResolve)
	{
		var expr;
		if(nameResolve.name === "prototype") {
			expr = nameResolve.parentExpr;
		}
		else 
		{
			if(!nameResolve.varBuffer) {
				throw "TypeError: Cannot set property '" + nameResolve.name + "' of undefined";
			}

			expr = nameResolve.varBuffer[nameResolve.name];
			if(expr) {
				nameResolve.isNew = false;
			}
			else {
				nameResolve.isNew = true;
				return;
			}				
		}

		if(nameResolve.name !== "prototype") {
			nameResolve.parentExpr = expr;
			nameResolve.holderScope = nameResolve.scope;
		}

		if(nameResolve.numToSolve < 2) {
			return;
		}

		var type, value;
		if(expr.exprType === this.exprType.VAR) 
		{
			type = expr.ref.type;
			value = expr.value;			
		}
		else {
			type = expr.type;
			value = expr;
		}

		var cls;
		if(type.templateCls) {
			cls = type.templateCls;
		}
		else {
			cls = type.cls;			
		}		
	
		switch(type.subType)
		{
			case this.subType.OBJECT:
			{
				if(nameResolve.name === "prototype") {
					throw "Cannot set property '" + nameResolve.name + "' of undefined";
				}

				nameResolve.varBuffer = value.scope.protoVars;				
				nameResolve.scope = value.scope;
			} break;

			case this.subType.CLASS:
			case this.subType.ARRAY:
			case this.subType.NUMBER:
			case this.subType.BOOL:
			case this.subType.STRING:			
			{
				if(nameResolve.name === "prototype") {
					throw "Cannot set property '" + nameResolve.name + "' of undefined";
				}

				nameResolve.varBuffer = cls.scope.protoVars;
				nameResolve.scope = cls.scope;
			} break;

			case this.subType.FUNCTION:
			{
				if(nameResolve.name === "prototype") {
					nameResolve.varBuffer = nameResolve.scope.protoVars;
				}
				else {
					nameResolve.varBuffer = nameResolve.scope.staticVars;
				}

				if(!value) {
					throw "Invalid value";
				}
				nameResolve.scope = value.scope;
			} break;

			default: 
			{
				this.refScope = null;
			} break;
		}
	},

	_resolveRootScope: function(node, nameResolve)
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
			nameResolve.isNew = true;
		}
		else {
			nameResolve.isNew = false;
		}

		nameResolve.scope = scope;
		nameResolve.varBuffer = scope.vars;
		nameResolve.holderScope = scope;
	},		

	getTmpResolve: function() 
	{
		if(this.tmpResolveBuffer.length === 0) {
			var nameResolve = new dopple.NameResolveInfo();
			this._clearNameResolve(nameResolve);
			return nameResolve;
		}

		return this.tmpResolveBuffer.pop();
	},

	popTmpResolve: function(buffer) {
		this.tmpResolveBuffer.push(buffer);
	},

	getTypeName: function(type)
	{
		var output = type.cls.name;
		if(type.templateType) {
			output += this.getTypeName(type.templateType);
		}

		return output;
	},

	//
	scope: null,
	globalScope: null,

	nameResolve: null,
	tmpResolveBuffer: null,

	insideFunc: 0,
	insideObj: 0,
	bodyResolved: false,

	types: dopple.types,
	exprType: dopple.ExprType,
	subType: dopple.SubType
};

dopple.NameResolveInfo = function() 
{
	this.name = null;
	this.scope = null;
	this.holderScope = null;
	this.varBuffer = null;
	this.parentExpr = null;
	this.numSolved = 0;
	this.numToSolve = 0;
	this.isNew = false;
	this.pointSelf = false;
};
