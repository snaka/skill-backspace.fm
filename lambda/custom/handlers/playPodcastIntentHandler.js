const PodcastPlayer = require('../podcast-player')

module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest' ||
      (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'PlayPodcastIntent')
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const podcast = new PodcastPlayer(handlerInput)
    await podcast.play()

    const speechText = t('SPEECH_START_PLAYING_EPISODE', podcast.localizedName, podcast.nowPlayingTitle)

    return podcast.response
      .speak(speechText)
      .withSimpleCard(t('CARD_TITLE_START_PLAYING', podcast.name), speechText)
      .getResponse()
  }
}
