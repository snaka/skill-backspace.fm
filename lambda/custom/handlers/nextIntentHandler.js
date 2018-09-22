const podcast = require('../podcast')

module.exports = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.NextIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const index = podcast.parseToken(token)

    const nextIndex = index + 1
    if (nextIndex >= podcast.config.MAX_EPISODE_COUNT) {
      return handlerInput.responseBuilder
        .speak(t('SPEECH_NEXT_EPISODE_NOT_EXIST'))
        .getResponse()
    }

    const nextToken = podcast.createToken(nextIndex)
    const episode = await podcast.getEpisodeInfo(podcast.config.ID, nextIndex)
    console.log('NEXT ', nextToken, episode)

    const speechText = t('SPEECH_EPISODE_AT_X_WILL_START', nextIndex + 1, episode.title)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, nextToken, 0)
      .withSimpleCard(t('CARD_TITLE_EPISODE_AT_X', podcast.config.NAME, nextIndex + 1), speechText)
      .getResponse()
  }
}
