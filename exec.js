var fs = require("fs");
var exec = require("child_process").exec;
var dopple = require("./dopple.latest.js").dopple;

var sourceFilePath = process.argv[2] || "";
var targetFilePath = process.argv[3] || "app";
if(!sourceFilePath) {
	console.log("Error: No input files.");
	return;
}

var isWin = /^win/.test(process.platform);
if(isWin) {
	targetFilePath += ".exe";
}

function init()
{
	if(getExt(sourceFilePath)) 
	{
		fs.readFile(sourceFilePath, function(err, buffer) 
		{
			if(err) { throw err; }
			var source = buffer.toString();
			readHeaders(source);
		});
	}
	else {
		readHeaders(sourceFilePath);
	}
};

function readHeaders(source) 
{
	fs.readFile("dopple.h", function(err, buffer) 
	{
		if(err) { throw err; }

		var headers = buffer.toString();
		var output = dopple.compile(source, headers);
		if(output) {
			save(output);
		}
	});	
};

function save(output) 
{
	exec("mkdir dopple");

	fs.writeFile("dopple/app.c", output, function(err) {
		if(err) { throw err; }
		compile();
	});
};

function compile()
{
	exec("gcc dopple/app.c -o " + targetFilePath, function() 
	{
		exec("./" + targetFilePath, function(err, data) {
			console.log(data);
		});
	});
};

function help()
{
	
};

function getExt(source) 
{
	var re = /(?:\.([^.]+))?$/;	
	var output = re.exec(source)[0];
	if(!output) {
		return null;
	}

	return output;
};

init();

