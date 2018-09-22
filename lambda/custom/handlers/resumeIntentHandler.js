const podcast = require('../podcast')

module.exports = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.ResumeIntent'
  },
  async handle (handlerInput) {
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
    const index = podcast.parseToken(token)
    const episode = await podcast.getEpisodeInfo(podcast.config.ID, index)

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, offset)
      .getResponse()
  }
}
