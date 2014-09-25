# Dopple 0.0.1-4-alpha

Dopple is compiler that generates C or LLVM from JavaScript code.

# Installation

Install package from `npm`:

	npm install dopple -g

This will install `dopple` globally so that it may be run from the command line.

### Windows

Dopple requires GCC compiler to be installed for automatic compilation and windows users should install it manually. 

# Usage 

### Global

	dopple [source] [target-path]
	
### Local

	node bin/dopple [source] [target-path]
	
### Arguments

`[source]` - JavaScript source file or code

`[target-path]` - Path for executable, this defaults to `./app` (or `./app.exe` on windows)

# Example

### From source file

	dopple ./source.js

### Feed code manually

	dopple 'var x = "Hello World!"; confirm(x);'
	
# License

Dopple is released under the Mozilla Public License v2.0 [MPL 2.0](https://www.mozilla.org/MPL/2.0/) 
	
* [Offical Website](http://infinite-games.com/)
* [Npm](https://www.npmjs.org/package/dopple)
