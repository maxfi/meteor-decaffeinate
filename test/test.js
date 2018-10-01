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

const run = async (t, fixture) => {
	const fixturePath = p(`./fixtures/${fixture}.coffee`)
	const tmpPath = p(`./tmp/${fixture}.coffee`)
	const resultPath = p(`./tmp/${fixture}.js`)
	const cleanupPattern = p(`./tmp/${fixture}.*`)

	try {
		await cp(fixturePath, tmpPath)

		// Check function returned correct result
		const result = await meteorDecaffeinate([tmpPath])
		t.deepEqual(result, {
			files: [resultPath]
		})

		// Check the file output is correct
		const actual = await readFile(result.files[0], 'utf-8')
		t.snapshot(actual)
	} finally {
		// Cleanup
		await del(cleanupPattern)
	}
}

test('should stop and show help when no arguments are passed', async t => {
	const {code, stderr} = await t.throws(cli())
	t.is(code, 2)
	t.regex(stderr, /\nMissing arguments\n/)
})

test('handles combined meteor and non-meteor globals', t => run(t, 'combined-globals'))

test('handles only meteor globals', t => run(t, 'only-meteor-globals'))

test('handles only non-meteor globals', t => run(t, 'only-non-meteor-globals'))
