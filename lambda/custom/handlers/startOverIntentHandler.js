let PodcastPlayer

module.exports = {
  set PodcastPlayer (clazz) {
    PodcastPlayer = clazz
  },
  get PodcastPlayer () {
    return PodcastPlayer
  },
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.StartOverIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const podcast = new PodcastPlayer(handlerInput)

    await podcast.startOver()

    return podcast.response
      .speak(t('SPEECH_START_OVER'))
      .getResponse()
  }
}
