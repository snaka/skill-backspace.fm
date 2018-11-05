const Alexa = require('ask-sdk-core')
const interceptors = require('./interceptors')
const handlers = require('./handlers')
const PodcastPlayer = require('./podcast-player')

module.exports = class PodcastSkillBuilder {
  constructor (podcastConfig) {
    PodcastPlayer.podcastConfig = podcastConfig
    for (let name in handlers) {
      if ('PodcastPlayer' in handlers[name]) {
        handlers[name].PodcastPlayer = PodcastPlayer
      }
    }
  }
  build (persistentAdapter) {
    return Alexa.SkillBuilders.custom()
      .withPersistenceAdapter(persistentAdapter)
      .addRequestInterceptors(
        interceptors.localizationInterceptor,
        interceptors.requestLoggingInterceptor,
        interceptors.defineUtilityInterceptor
      )
      .addResponseInterceptors(
        interceptors.responseLoggingInterceptor,
        interceptors.savePersistentAttributesInterceptor
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
  }
}
