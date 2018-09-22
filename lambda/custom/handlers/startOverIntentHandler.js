const podcast = require('../podcast')

module.exports = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.StartOverIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const index = podcast.parseToken(token)
    const episode = await podcast.getEpisodeInfo(podcast.config.ID, index)

    console.log(`START OVER: token ${token}`)

    return handlerInput.responseBuilder
      .speak(t('SPEECH_START_OVER'))
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .getResponse()
  }
}
