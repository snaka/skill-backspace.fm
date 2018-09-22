const podcast = require('../podcast')

module.exports = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'FastforwardIntent'
  },
  async handle (handlerInput) {
    const attrs = handlerInput.attributesManager.getRequestAttributes()
    const t = attrs.t

    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    if (!token) {
      const speechText = t('SPEECH_PLAYER_STATE_IS_NOT_PLAYING', podcast.config.MAX_EPISODE_COUNT)
      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse()
    }

    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
    const index = podcast.parseToken(token)
    const episode = await podcast.getEpisodeInfo(podcast.config.ID, index)

    const skipMinutes = attrs.getSlotValueAsInt('skipMinutes')

    let newOffset = offset + skipMinutes * 60000

    console.log(`FASTFORWARD: token ${token} offset ${offset} skipMinutes ${skipMinutes}`)

    return handlerInput.responseBuilder
      .speak(t('SPEECH_FASTFORWARD_X_MIN', skipMinutes))
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, newOffset)
      .getResponse()
  }
}
