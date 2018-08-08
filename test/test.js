import path from 'path'
import fs from 'fs'
import util from 'util'
import test from 'ava'
import cp from 'cp-file'
import del from 'del'
import execa from 'execa'

import meteorDecaffeinate from '..'

const readFile = util.promisify(fs.readFile)

const p = (...paths) => path.join(__dirname, ...paths)

const cli = (args = [], opts = {}) => execa(p('../cli.js'), args, opts)

test('should stop and show help when no arguments are passed', async t => {
	const {code, stderr} = await t.throws(cli())
	t.is(code, 2)
	t.regex(stderr, /\nMissing arguments\n/)
})

test('it works', async t => {
	const input = p('./tmp/input.coffee')
	await cp(p('./fixtures/input.coffee'), input)

	const result = await meteorDecaffeinate([input])
	t.deepEqual(result, {
		files: [p('./tmp/input.js')]
	})

	const actual = await readFile(result.files[0], 'utf-8')
	const expected = await readFile(p('./fixtures/output.js'), 'utf-8')
	t.is(actual, expected)

	// Cleanup
	await del(p('./tmp'))
})
