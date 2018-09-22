/* eslint-disable  func-names */
/* eslint-disable  no-console */
'use strict'

const Alexa = require('ask-sdk-core')
const interceptors = require('./interceptors')
const handlers = require('./handlers')

const skillBuilder = Alexa.SkillBuilders.custom()

exports.handler = skillBuilder
  .addRequestInterceptors(
    interceptors.localizationInterceptor,
    interceptors.requestLoggingInterceptor,
    interceptors.defineUtilityInterceptor
  )
  .addResponseInterceptors(
    interceptors.responseLoggingInterceptor
  )
  .addRequestHandlers(
    handlers.warmUpHandler,
    handlers.playPodcastIntentHandler,
    handlers.playPodcastByIndexIntentHandler,
    handlers.startOverIntentHandler,
    handlers.fastForwardIntentHandler,
    handlers.rewindIntentHandler,
    handlers.helpIntentHandler,
    handlers.cancelAndStopIntentHandler,
    handlers.resumeIntentHandler,
    handlers.nextIntentHandler,
    handlers.previousIntentHandler,
    handlers.unsupportedIntentHandler,
    handlers.audioPlayerEventHandler,
    handlers.sessionEndedRequestHandler,
    handlers.systemExceptionHandler
  )
  .addErrorHandlers(handlers.errorHandler)
  .lambda()
