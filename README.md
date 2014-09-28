# Dopple 0.0.2-4-alpha

Dopple is compiler that generates C or LLVM from JavaScript code.

# 1. Installation

Install package from `npm`:

	npm install dopple -g

This will install `dopple` globally so that it may be run from the command line.

### Windows

Dopple requires GCC compiler to be installed for automatic compilation and windows users should install it manually. 

# 2. Usage 
	
After compilation in your root directory will be added executable and `dopple` folder that contains all generated C source files.

### Global

	dopple [source] [target-path]
	
### Local

	node bin/dopple [source] [target-path]
	
### Arguments

`[source]` - JavaScript source file or code

`[target-path]` - Path for executable, this defaults to `./app` (or `./app.exe` on windows)

# 3. Example

### From source file

	dopple ./source.js

### Feed code manually

	dopple 'var x = "Hello World!"; alert(x);'
	
# 4. License

Dopple is released under the Mozilla Public License v2.0 [MPL 2.0](https://www.mozilla.org/MPL/2.0/)

# 5. Links 
	
* [Offical Website](http://infinite-games.com/)
* [Npm](https://www.npmjs.org/package/dopple)
* [Twitter](https://twitter.com/ArthurShefer)
