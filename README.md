# Dopple 0.0.1-4-alpha

Dopple is compiler that generates C or LLVM from JavaScript code.

# Installing:

Install package from `npm`:

	npm install dopple -g

This will install `dopple` globally so that it may be run from the command line.

# Usage 

	dopple [source] [target-path]

`[source]` - JavaScript source file or code
`[target-path]` - Path for executable, this defaults to `./app` (or `./app.exe` on windows)

## Compile locally

	mode bin/dopple