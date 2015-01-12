"use strict";

dopple.Resolver = function() {
	this.optimizer = new dopple.Optimizer(this);
	this.scope = null;
	this.global = null;
};

dopple.Resolver.prototype = 
{
	handle: function(scope) {
		this.varEnum = dopple.VarEnum;
		this.global = scope;
		this.resolve(scope);
	},

	resolve: function(scope)
	{
		var prevScope = this.scope;
		this.scope = scope;

		// Resolve classes:
		var i;
		var classes = scope.classes;
		var numClasses = classes.length;
		for(i = 0; i < numClasses; i++) 
		{
			this.resolveCls(classes[i]);
			if(dopple.isError) { return; }
		}

		// Resolve functions:
		var funcs = scope.funcs;
		var numFuncs = funcs.length;
		for(i = 0; i < numFuncs; i++) 
		{
			this.registerFunc(funcs[i]);
			if(dopple.isError) { return; }
		}

		// Resolve the rest of the scope:
		var expr, type;
		var exprs = scope.exprs;
		var numExprs = exprs.length;
		for(i = 0; i < numExprs; i++)
		{
			expr = exprs[i];
			if(expr.extern) { continue; }

			type = expr.exprType;
			switch(type)
			{
				case this.exprEnum.VAR: 
					this.resolveVar(expr);
					break;

				case this.exprEnum.IF:
					this.resolveIf(expr);
					break;

				case this.exprEnum.FOR:
					this.resolveFor(expr);
					break;

				case this.exprEnum.FUNCTION_CALL:
					this.resolveFuncCall(expr);
					break;

				case this.exprEnum.RETURN:
					this.resolveReturn(expr);
					break;
			}

			if(dopple.isError) { return; }
		}

		var key, item, group;
		for(key in scope.vars) {
			scope.varGroup = {};
			break;
		}

		// Local variables:
		for(key in scope.vars)
		{
			item = scope.vars[key];
			if(item.exprType !== this.exprEnum.VAR) { continue; }
			if(item.isArg) { continue; }
			if(item.type === 0) { continue; }

			group = scope.varGroup[item.type];
			if(!group) {
				group = [];
				scope.varGroup[item.type] = group;
			}

			group.push(item);
		}

		// Local static variables:
		for(key in scope.staticVars)
		{
			item = scope.staticVars[key];
			if(item.exprType !== this.exprEnum.VAR) { continue; }
			if(item.isArg) { continue; }
			if(item.type === 0) { continue; }

			group = scope.staticVarGroup[item.type];
			if(!group) {
				group = [];
				scope.staticVarGroup[item.type] = group;
			}

			group.push(item);
		}	

		this.scope = prevScope;
	},

	registerFunc: function(funcExpr) 
	{
		if(this.scope.vars[funcExpr.name]) {
			dopple.error(funcExpr.line, dopple.Error.REDEFINITION, funcExpr.name);
			return;
		}	
		this.scope.vars[funcExpr.name] = funcExpr; 
	},

	resolveRef: function(varExpr)
	{
		// Define variable or check if is defined:
		var originalVarExpr = this.scope.vars[varExpr.value];
		if(!originalVarExpr)
		{
			if(varExpr.isDef) {
				this.scope.vars[varExpr.value] = varExpr;
				originalVarExpr = varExpr;
			}
			else {
				dopple.refError(varExpr.line, varExpr.value);
			}
		}
		else {
			varExpr.type = originalVarExpr.type;
		}

		return originalVarExpr;
	},

	resolveVar: function(varExpr)
	{
		if(varExpr.flag & varExpr.Flag.RESOLVED) { return; }

		var expr = varExpr.expr;
		if(expr)
		{
			var exprType = expr.exprType;
			if(exprType === this.exprEnum.CLASS) {
				this.resolveCls(varExpr.expr);
				varExpr.hidden = true;
			}
			else if(exprType === this.exprEnum.FUNCTION) {
				this.resolveFunc(varExpr.expr);
				varExpr.hidden = true;
			}
			else
			{	
				varExpr.var = this.resolveRef(varExpr);
				if(dopple.isError) { return; }

				this.analyseExpr(varExpr);
				varExpr.expr = this.optimizer.do(varExpr.expr);
			}
		}
		else 
		{
			this.resolveRef(varExpr);
			if(dopple.isError) { return; }	

			varExpr.hidden = true;		
		}

		// if(varExpr.expr.exprType === this.exprEnum.ALLOC) 
		// {
		// 	if(!this.resolveAlloc(varExpr.expr)) {
		// 		return false;
		// 	}
		// }
		// else {
			
		// }

		varExpr.flag |= varExpr.Flag.RESOLVED;
	},

	resolveName: function(varExpr)
	{
		if(varExpr.flag & varExpr.Flag.RESOLVED) { return; }

		this.resolveRef(varExpr);

		varExpr.flag |= varExpr.Flag.RESOLVED;
	},

	resolveExpr: function(varExpr) 
	{
		if(varExpr.flag & varExpr.Flag.RESOLVED) { return; }

		this.analyseExpr(varExpr);
		if(dopple.isError) { return; }

		varExpr.expr = this.optimizer.do(varExpr.expr);
		varExpr.flag |= varExpr.Flag.RESOLVED;
	},

	analyseExpr: function(varExpr)
	{	
		var exprType = varExpr.expr.exprType;

		//
		if(exprType === this.exprEnum.VAR) {
			this.resolveName(varExpr.expr);
			varExpr.type = varExpr.expr.type;
		}
		else if(exprType === this.exprEnum.BINARY) {
			varExpr.type = this.analyseBinary(varExpr.expr, varExpr);
		}
		else if(exprType === this.exprEnum.FUNCTION_CALL) 
		{
			this.resolveFuncCall(varExpr.expr);
			varExpr.type = varExpr.expr.func.type;
		}
		else if(exprType === this.exprEnum.FUNCTION) {
			varExpr.type = this.varEnum.FUNCTION_PTR;			
		}
		else {	
			varExpr.type = varExpr.expr.type;		
		}

		if(this.isError) { return; }

		// Check if type is sufficient:
		if(varExpr.type === 0) {
			dopple.error(varExpr.line, dopple.Error.EXPR_WITH_VOID, varExpr.value);
		}	
		else 
		{
			if(varExpr.var.type === 0) {
				varExpr.var.type = varExpr.type;
			}
			else if(varExpr.var.type !== varExpr.type)
			{
				dopple.error(varExpr.line, dopple.Error.INCOMPATIBLE_TYPE, varExpr.value, 
					dopple.strType(varExpr.type) + " != " + dopple.strType(varExpr.var.type));
			}
		}
	},	

	analyseBinary: function(binExpr, varExpr)
	{
		var lhsType, rhsType;
		var exprType;

		// LHS:
		if(binExpr.lhs.exprType === this.exprEnum.BINARY) {
			lhsType = this.analyseBinary(binExpr.lhs, varExpr);
		}
		else 
		{
			exprType = binExpr.lhs.exprType;

			if(exprType === this.exprEnum.VAR) 
			{
				this.resolveName(binExpr.lhs);
				lhsType = binExpr.lhs.type;
			}
			if(exprType === this.exprEnum.FUNCTION_CALL) {
				this.resolveFuncCall(binExpr.lhs);
				lhsType = binExpr.lhs.func.type;
			}
			else {
				lhsType = binExpr.lhs.type;
			}
		}

		if(dopple.isError) { return; }

		// RHS:
		if(binExpr.rhs.exprType === this.exprEnum.BINARY) {
			rhsType = this.analyseBinary(binExpr.rhs, varExpr);
		}
		else 
		{
			exprType = binExpr.rhs.exprType;

			if(exprType === this.exprEnum.VAR) 
			{
				this.resolveName(binExpr.rhs);
				rhsType = binExpr.rhs.type;
			}
			else if(exprType === this.exprEnum.FUNCTION_CALL) {
				this.resolveFuncCall(binExpr.rhs);
				rhsType = binExpr.rhs.func.type;
			}
			else {
				rhsType = binExpr.rhs.type;
			}
		}

		if(dopple.isError) { return; }

		// Type checking:
		if(lhsType === rhsType) 
		{
			if(binExpr.lhs.type === this.varEnum.BOOL && binExpr.rhs.type === this.varEnum.BOOL) {
				binExpr.type = this.varEnum.NUMBER;
			}
			else {
				binExpr.type = lhsType;
			}

			return binExpr.type;
		}

		if(lhsType === this.varEnum.STRING || rhsType === this.varEnum.STRING) {
			binExpr.type = this.varEnum.STRING;
			return this.varEnum.STRING;
		}

		dopple.error(varExpr.line, dopple.Error.INCOMPATIBLE_TYPE, varExpr.value, 
			dopple.strType(binExpr.lhs.type) + " != " + dopple.strType(binExpr.rhs.type));

		return 0;
	},

	resolveIf: function(expr)
	{
		var branch, branchExpr;
		var branches = expr.branches;
		var numBranches = branches.length;
		for(var i = 0; i < numBranches; i++) 
		{
			branch = branches[i];
			branchExpr = branch.expr;

			if(branchExpr)
			{
				branchExpr = this.optimizer.do(branchExpr);
				if(!branchExpr.analyse(this)) {
					return null;
				}
			}

			if(!this.resolve(branch.scope)) {
				return false;
			}
		}

		return true;
	},

	resolveFor: function(forExpr)
	{
		if(forExpr.initExpr) {
			if(!this.resolveVar(forExpr.initExpr)) { return false; }
		}

		if(forExpr.cmpExpr) 
		{
			forExpr.cmpExpr = this.resolveExpr(forExpr.cmpExpr);
			if(!forExpr.cmpExpr) { return false; }
		}	

		if(forExpr.iterExpr) 
		{
			forExpr.iterExpr = this.resolveExpr(forExpr.iterExpr);
			if(!forExpr.iterExpr) { return false; }
		}		

		if(!this.resolve(forExpr.scope)) {
			return false;
		}			

		return true;
	},

	resolveFunc: function(funcExpr) 
	{
		if(funcExpr.numUnresolvedParams > 0) { return; }
		if(funcExpr.flag & funcExpr.Flag.RESOLVED) { return; }

		var retExpr, i;
		var retExprs = funcExpr.scope.returns;
		var numRetExprs = retExprs.length;

		if(funcExpr.type === 0 && (funcExpr.flag & funcExpr.Flag.RESOLVING)) 
		{
			// Try first to guess function type if type is unknown:
			for(i = 0; i < numRetExprs; i++)
			{			
				retExpr = retExprs[i].expr;
				if(!retExpr) { continue; }

				//retExpr.expr = this.optimizer.do(retExpr.expr);
				retExpr.analyse(this);	

				if(funcExpr.type === 0) {
					funcExpr.type = retExpr.type;
					break;
				}				
			}

			return true;
		}	

		funcExpr.flag |= funcExpr.Flag.RESOLVING;

		// Error: If type is defined without return expression:
		if(funcExpr.type !== 0 && numRetExprs === 0) {
			console.error("ReturnError: Function \'" + funcExpr.name + "\' requires at least one return expression");
			return false;		
		}

		this.resolve(funcExpr.scope);
		if(dopple.isError) { return; }

		// Re-check function type:
		for(i = 0; i < numRetExprs; i++)
		{
			retExpr = retExprs[i].varExpr;
			if(!retExpr) { continue; }

			if(funcExpr.type === 0) {
				funcExpr.type = retExpr.type;
			}
			else if(funcExpr.type !== retExpr.type) 
			{
				console.error("ReturnError: Function \'" + funcExpr.name + 
					"\' different return expressions dont have matching return types: is " + 
					funcExpr.strType() + " but expected " + retExpr.strType());
				return false;
			}
		}

		funcExpr.flag |= funcExpr.Flag.RESOLVED;
		funcExpr.flag &= ~funcExpr.Flag.RESOLVING;

		return true;
	},

	resolveFuncCall: function(callExpr) 
	{
		if(callExpr.flag & callExpr.Flag.RESOLVED) { return; }
		if(callExpr.flag & callExpr.Flag.RESOLVING) { return; }

		callExpr.flag |= callExpr.Flag.RESOLVING;

		var funcExpr = this.getVar(callExpr.name, callExpr.parentList);
		if(!funcExpr) { 
			dopple.error(callExpr.line, dopple.Error.REFERENCE_ERROR, callExpr.name);
			return; 
		}

		if(funcExpr.exprType !== this.exprEnum.FUNCTION) {
			dopple.error(callExpr.line, dopple.Error.EXPECTED_FUNC, callExpr.name);
			return;
		}

		var args = callExpr.args;
		var numArgs = callExpr.numArgs;
		var numParams = funcExpr.numParams;

		// Error: If function call has too many arguments and function does not take args:
		if(numArgs > numParams) 
		{
			if(funcExpr.argsIndex === -1) {
				dopple.error(callExpr.line, dopple.Error.TOO_MANY_ARGS, funcExpr.name, numArgs, numParams);
				return;	
			}
		}

		// Resolve all arguments:
		var argExpr, paramExpr;
		for(var i = 0; i < numArgs; i++)
		{
			argExpr = callExpr.args[i];
			paramExpr = funcExpr.params[i];

			if(argExpr.exprType === this.exprEnum.FUNCTION_CALL) 
			{
				this.resolveFuncCall(argExpr);
				if(dopple.isError) { return; }

				argExpr.type = argExpr.func.type;
			}
			else 
			{
				argExpr.analyse();
				if(dopple.isError) { return; }

				args[i] = this.optimizer.do(argExpr);
			}

			if(paramExpr.type === 0) {
				paramExpr.type = argExpr.type;
				funcExpr.numUnresolvedParams--;
			}
			else if(paramExpr.type !== argExpr.type) 
			{
				dopple.error(callExpr.line, dopple.Error.INCOMPATIBLE_TYPE, callExpr.name, 
					dopple.strType(argExpr.type) + " != " + dopple.strType(funcExpr.type));
				return;
			}
		}

		// Add missing arguments so they fill argument with default value:
		if(numArgs < numParams)
		{
			args.length = numParams;
			for(i--; i < numParams; i++) {
				args[i] = funcExpr.params[i];
			}
		}

		callExpr.func = funcExpr;

		if(!funcExpr.extern)
		{
			this.resolveFunc(funcExpr);
			if(dopple.isError) { return; }
		}

		callExpr.flag |= callExpr.Flag.RESOLVED;
		callExpr.flag &= ~callExpr.Flag.RESOLVING;
	},

	resolveReturn: function(retExpr) {
		this.resolveExpr(retExpr.varExpr);
	},

	resolveCls: function(clsExpr)
	{
		if(clsExpr.flag & clsExpr.Flag.RESOLVED) { return; }

		if(this.scope.vars[clsExpr.name]) {
			dopple.error(clsExpr.line, dopple.Error.REDEFINITION, clsExpr.name);
			return;
		}

		this.scope.vars[clsExpr.name] = clsExpr;
		if(!this.scope.classes) {
			this.scope.classes = [ clsExpr ];
		}
		else {
			this.scope.classes.push(clsExpr);
		}

		var prevScope = this.scope;
		this.scope = clsExpr.scope;

		var expr;
		var vars = clsExpr.scope.vars;
		for(var key in vars) 
		{
			expr = vars[key];

			switch(expr.exprType)
			{
				case this.exprEnum.VAR:
					this.resolveVar(expr);
					break;

				case this.exprEnum.FUNCTION:
					this.resolveFunc(expr);
					break;

				case this.exprEnum.CLASS:
					this.resolveCls(expr);
					break;
			}
			
			if(dopple.isError) { return; }
		}

		this.scope = prevScope;

		clsExpr.flag |= clsExpr.Flag.RESOLVED;		
	},

	resolveAlloc: function(allocExpr) 
	{
		if(!allocExpr.cls.isStatic) 
		{
			if(!this.resolveFuncCall(allocExpr.constrCall)) {
				return false;
			}
		}

		return true;
	},

	getVar: function(name, parentList) 
	{
		var expr = this.scope.vars[name];
		if(!expr) 
		{
			expr = this.global.vars[name];
			if(!expr) {
				return null;
			}
		}

		return expr;
	},

	//
	optimizer: null,

	settings: dopple.settings,
	exprEnum: dopple.ExprEnum,
	varEnum: null,

	numDiscards: 0
};

dopple.resolver = new dopple.Resolver();
