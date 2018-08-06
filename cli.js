#!/usr/bin/env node
'use strict'
const meow = require('meow')
const meteorDecaffeinate = require('.')

const cli = meow(`
	Usage
	  $ meteor-decaffeinate <input>

	Options
	  --editor Open converted files in editor upon completion. Eg 'atom'

	Examples
	  $ meteor-decaffeinate --editor atom fileOne.coffee fileTwo.coffee
`, {flags: {
	editor: {
		type: 'string',
		alias: 'e'
	}
}
})

meteorDecaffeinate(cli.input, cli.flags)
