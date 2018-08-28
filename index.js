const path = require('path')
const fs = require('fs')
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

// Decaffeinates files
// Returns the paths of the resulting js files
async function decaffeinate(paths) {
	console.log('Decaffeinating files...')
	return Promise.all(
		paths.map(async x => {
			// Returns Promise<void> from https://github.com/decaffeinate/decaffeinate/blob/8b8f6b86e06a10d3bca2519baea53432332147cb/src/cli.ts#L13
			// exported from https://github.com/decaffeinate/decaffeinate/blob/8b8f6b86e06a10d3bca2519baea53432332147cb/src/index.ts#L23
			await decaffeinateLib.run(['--use-js-modules', x])

			// Because the above doesn't return the path of the js file we create and return it
			const {dir, name} = path.parse(x)
			return path.join(dir, name + '.js')
		})
	)
}

// Takes CamelCased files and converts them to dashified paths
function dashifyFilePaths(paths) {
	return paths.map(oldPath => {
		const {dir, name, ext} = path.parse(oldPath)
		const newPath = path.join(dir, dashify(name) + ext)
		fs.renameSync(oldPath, newPath)
		return newPath
	})
}

async function getGlobals(path) {
	// Explicitly pass the `cwd` as root directory of `meteor-decaffeinate`
	// to have xo use the xo settings from this package rather the xo
	// settings from the actual cwd as we only care about gettings the
	// globals from this call to `xo.lintFiles`
	const {results} = await xo.lintFiles([path], {cwd: __dirname})
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
		if (globals.length === 0) {
			return
		}
		const fileHeader = esLintGlobals(globals) + meteorImports(globals)
		return prependFile(x, fileHeader)
	}))
}

async function fix(paths) {
	// Only proceed if there are paths to avoid running `xo --fix` on all files
	if (paths.length === 0) {
		return
	}
	// Only proceed if a package.json is found
	const {pkg} = await readPkgUp()
	if (!pkg) {
		return
	}
	const hasXo = (pkg.devDependencies && pkg.devDependencies.xo) || (pkg.dependencies && pkg.dependencies.xo)
	if (hasXo) {
		console.log('\nXO detected. Fixing...')
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
	const decaffeinatedPaths = await decaffeinate(coffeePaths)
	await del(coffeePaths)
	const files = dashifyFilePaths(decaffeinatedPaths)

	await addHeaders(files)
	await fix(files)

	console.log('\nNew files:')
	files.forEach(x => console.log(x))

	const {editor} = options
	if (editor) {
		openEditor(files, {editor})
	}
	return {
		files
	}
}

module.exports = run
