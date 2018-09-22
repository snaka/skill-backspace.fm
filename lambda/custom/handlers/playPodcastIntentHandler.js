const podcast = require('../podcast')

module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest' ||
      (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'PlayPodcastIntent')
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    console.log('PLAY PODCAST')

    const token = podcast.createToken(0)
    const episode = await podcast.getEpisodeInfo(podcast.config.ID, 0)
    console.log('episode: ', episode)
    const speechText = t('SPEECH_START_PLAYING_EPISODE', podcast.config.NAME_LOCALIZED, episode.title)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .withSimpleCard(t('CARD_TITLE_START_PLAYING', podcast.config.NAME), speechText)
      .getResponse()
  }
}
