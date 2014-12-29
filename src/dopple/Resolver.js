"use strict";

dopple.Resolver = function() {
	this.optimizer = new dopple.Optimizer(this);
};

dopple.Resolver.prototype = 
{
	resolve: function(scope)
	{
		var expr, type, i;
		var exprs = scope.exprs;
		var numExpr = exprs.length;
		for(i = 0; i < numExpr; i++)
		{
			expr = exprs[i];
			if(expr.extern) { continue; }

			type = expr.exprType;

			if(type === this.exprEnum.VAR) 
			{
				if(!this.resolveVar(expr)) {
					return false;
				}				
			}
			else if(type === this.exprEnum.IF) 
			{
				if(!this.resolveIf(expr)) {
					return false;
				}
			}
			else if(type === this.exprEnum.FOR)
			{
				if(!this.resolveFor(expr)) {
					return false;
				}
			}
			else if(type === this.exprEnum.FUNCTION_CALL) 
			{
				if(!this.resolveFuncCall(expr)) {
					return false;
				}
			}
			else if(type === this.exprEnum.RETURN) 
			{
				expr.expr.expr = this.optimizer.do(expr.expr.expr);
				if(!expr.expr.analyse(this)) {
					return false;
				}				
			}
		}

		var item, group;
		for(var key in scope.vars)
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

		return true;
	},

	resolveVar: function(expr)
	{
		if(this.settings.stripDeadCode && expr.var.numUses === 0) {
			return true;
		}

		expr.expr = this.optimizer.do(expr.expr);
		if(!expr.analyse(this)) {
			return false;
		}

		if(!expr.expr) {
			console.error("(Resolver) Unresolved variable '" + dopple.makeVarName(expr) + "'");
			return false;
		}

		return true;
	},

	resolveExpr: function(expr)
	{
		expr = this.optimizer.do(expr);
		if(!expr.analyse(this)) {
			return null;
		}

		return expr;		
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

	resolveFunc: function(expr) 
	{
		if(expr.resolved) { return true; }

		if(expr.obj) {
			this.resolveObj(expr.obj);
		}

		var retExpr, i;
		var retExprs = expr.scope.returns;
		var numRetExprs = retExprs.length;

		if(expr.type === 0 && expr.resolving) 
		{
			// Try first to guess function type if type is unknown:
			for(i = 0; i < numRetExprs; i++)
			{			
				retExpr = retExprs[i].expr;
				if(!retExpr) { continue; }

				//retExpr.expr = this.optimizer.do(retExpr.expr);
				retExpr.analyse(this);	

				if(expr.type === 0) {
					expr.type = retExpr.type;
					break;
				}				
			}

			return true;
		}

		expr.resolving = true;

		// Error: If type is defined without return expression:
		if(expr.type !== 0 && numRetExprs === 0) {
			console.error("ReturnError: Function \'" + expr.name + "\' requires at least one return expression");
			return false;		
		}

		if(!this.resolve(expr.scope)) { return false; }

		// Re-check function type:
		for(i = 0; i < numRetExprs; i++)
		{
			retExpr = retExprs[i].expr;
			if(!retExpr) { continue; }

			if(expr.type === 0) {
				expr.type = retExpr.type;
			}
			else if(expr.type !== retExpr.type) 
			{
				console.error("ReturnError: Function \'" + expr.name + 
					"\' different return expressions dont have matching return types: is " + 
					expr.strType() + " but expected " + retExpr.strType());
				return false;
			}
		}

		expr.resolved = true;
		expr.resolving = false;

		return true;
	},

	resolveFuncCall: function(expr) 
	{
		if(expr.resolved || expr.resolving) { return true; }
		expr.resolving = true;

		var funcExpr = expr.func;
		if(funcExpr.empty) {
			dopple.error(this, dopple.Error.REFERENCE_ERROR, funcExpr.name);
			return false;
		}

		var i;
		var args = expr.args;
		var params = funcExpr.params;
		if(params)
		{
			var numArgs = args.length;
			var numParams = params.length;

			// If function call has too many arguments, check first if any of argument is FORMAT:
			var format;
			if(numArgs > numParams) 
			{
				format = false; 

				for(i = 0; i < numParams; i++) 
				{
					if(params[i].type === this.varEnum.FORMAT) {
						format = true;
						break;
					}
				}

				if(!format) {
					console.error("TOO_MANY_ARGS: Function call \"" + funcExpr.name + "\" has " 
						+ numArgs + " args, expecting maximum of " + numParams + " args");
					return false;				
				}
			}	

			// Analyse all argument expressions:
			var argExpr;
			for(i = 0; i < numArgs; i++)
			{
				argExpr = this.optimizer.do(args[i]);
				if(!argExpr.analyse()) { 
					return false; 
				}
				args[i] = argExpr;

				if(i < numParams && params[i].type === 0) {
					params[i].type = argExpr.type;
				}
			}
		}

		if(!funcExpr.extern)
		{
			if(!this.resolveFunc(funcExpr)) {
				return false;
			}
		}

		expr.resolved = true;
		expr.resolving = false;

		return true;
	},

	resolveObj: function(objExpr)
	{
		var expr;
		var vars = objExpr.scope.vars;
		for(var key in vars) 
		{
			expr = vars[key];
			if(expr.exprType !== this.exprEnum.VAR) { continue; }
			
			if(!this.resolveVar(expr)) { 
				return false;
			}
		}

		return true;
	},

	//
	optimizer: null,

	settings: dopple.settings,
	exprEnum: dopple.ExprEnum,
	varEnum: dopple.VarEnum,

	numDiscards: 0
};

dopple.resolver = new dopple.Resolver();
