/* eslint-disable  func-names */
/* eslint-disable  no-console */
'use strict'

const Adapter = require('ask-sdk-dynamodb-persistence-adapter')
const { PodcastSkillBuilder } = require('alexa-podcast-skill-builder')
const podcastConfig = require('./constants')

const skillBuilder = new PodcastSkillBuilder(podcastConfig)
const dynamoDBAdapter = new Adapter.DynamoDbPersistenceAdapter({
  tableName: process.env.PERSISTENT_STORE_TABLE,
  createTable: true
})

exports.handler = skillBuilder.build(dynamoDBAdapter)
