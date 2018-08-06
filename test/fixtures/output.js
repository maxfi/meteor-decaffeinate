/* global SomeCollection */

import {Meteor} from 'meteor/meteor'
import {check} from 'meteor/check'

/*
 * Decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Meteor.methods({someMethod(args) {
	check(args, Array)
	this.unblock()

	return SomeCollection.find()
}
})
