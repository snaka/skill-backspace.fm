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
      (request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent' ||
        request.intent.name === 'AMAZON.PauseIntent')
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const podcast = new PodcastPlayer(handlerInput)

    await podcast.stop()

    if (podcast.isPlaying) {
      return podcast.response.getResponse()
    }

    return podcast.response
      .speak(t('SPEECH_STOP'))
      .getResponse()
  }
}
