# meteor-decaffeinate [![Build Status](https://travis-ci.org/maxfi/meteor-decaffeinate.svg?branch=master)](https://travis-ci.org/maxfi/meteor-decaffeinate)

> Quickly and easily decaffeinate, lint and fix (xo) coffeescript files in a meteor project.

## Why

- Converting a legacy coffeescript meteor codebase is a PITA.
- Uses the awesome [decaffeinate](https://github.com/decaffeinate/decaffeinate) and [xo](https://github.com/xojs/xo) projects to output modern JavaScript!
- Uses your `package.json` defined [xo](https://github.com/xojs/xo) configuration if you use [xo](https://github.com/xojs/xo) in your project already.

## Install

```
$ npm install --global meteor-decaffeinate
```

## CLI

```
$ meteor-decaffeinate --help

	Usage
	  $ meteor-decaffeinate <input>
	
	Options
	  --editor Open converted files in editor upon completion. Eg 'atom'
	
	Examples
	  $ meteor-decaffeinate fileOne.coffee
	  $ meteor-decaffeinate --editor atom fileOne.coffee fileTwo.coffee
```

## License

MIT © [Max](https://github.com/maxfi)
