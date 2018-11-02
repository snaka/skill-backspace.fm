const PodcastPlayer = require('../podcast-player')

module.exports = {
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
