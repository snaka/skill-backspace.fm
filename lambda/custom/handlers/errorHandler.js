module.exports = {
  set PodcastPlayer (_) { /* do nothing */ },
  canHandle () {
    return true
  },
  handle (handlerInput, error) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const speechText = t('SPEECH_ERROR_OCCURRED')
    console.log(`ERROR: ${error.message}\n${error.stack}`)

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse()
  }
}
