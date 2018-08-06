const path = require('path')
const util = require('util')
const dashify = require('dashify')
const isFile = require('is-file')
const decaffeinateLib = require('decaffeinate')
const del = require('del')
const xo = require('xo')
const _ = require('lodash/fp')
const execa = require('execa')
const prependFile = util.promisify(require('prepend-file'))
const readPkgUp = require('read-pkg-up')
const openEditor = require('open-editor')
const METEOR_IMPORTS = require('./meteor-imports')

function filePaths(fileNames) {
	const paths = fileNames.map(x => path.resolve(x))

	// Check that files exist
	paths.forEach(x => {
		if (!isFile(x)) {
			throw new Error(`${x}: No such file`)
		}
	})

	return paths
}

async function decaffeinate(paths) {
	return Promise.all(paths.map(x => decaffeinateLib.run(['--use-js-modules', x])))
}

function dashifyPaths(paths) {
	return paths.map(x => {
		const {dir, name} = path.parse(x)
		return path.join(dir, dashify(name) + '.js')
	})
}

async function getGlobals(path) {
	const {results} = await xo.lintFiles([path])
	return _.pipe(
		_.map(
			_.pipe(
				_.prop('messages'),
				_.filter({ruleId: 'no-undef'})
			)
		),
		_.flatten,
		_.map(x => x.message.match(/^'(\w+)'/)[1]),
		_.uniq
	)(results)
}

function esLintGlobals(globals) {
	const str = globals.filter(x => !METEOR_IMPORTS[x]).join(' ')
	return `/* global ${str} */\n\n`
}

function meteorImports(globals) {
	return globals.filter(x => METEOR_IMPORTS[x])
		.map(x => `import {${x}} from '${METEOR_IMPORTS[x]}'`)
		.join('\n').concat('\n\n')
}

async function addHeaders(paths) {
	return Promise.all(paths.map(async x => {
		const globals = await getGlobals(x)
		const fileHeader = esLintGlobals(globals) + meteorImports(globals)
		return prependFile(x, fileHeader)
	}))
}

async function fix(paths) {
	const {pkg} = await readPkgUp()
	const hasXo = (pkg.devDependencies && pkg.devDependencies.xo) || (pkg.dependencies && pkg.dependencies.xo)
	if (hasXo) {
		console.log('xo detected. Fixing...')
		try {
			const {stdout} = await execa('xo', ['--fix', ...paths])
			return stdout
		} catch (e) {
			const {stdout} = e
			return stdout
		}
	}
}

async function run(input, options = {}) {
	const coffeePaths = filePaths(input)
	await decaffeinate(coffeePaths)

	const jsPaths = dashifyPaths(coffeePaths)
	await del(coffeePaths)

	await addHeaders(jsPaths)
	await fix(jsPaths)

	const {editor} = options
	if (editor) {
		openEditor(jsPaths, {editor})
	}
	return {
		files: jsPaths
	}
}

module.exports = run
