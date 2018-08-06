Meteor.methods someMethod: (args) ->
  check args, Array
  @unblock()

  SomeCollection.find()