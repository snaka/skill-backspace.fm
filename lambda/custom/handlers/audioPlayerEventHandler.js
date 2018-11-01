const podcast = require('../podcast')

module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.')
  },
  async handle (handlerInput) {
    const {
      requestEnvelope,
      responseBuilder
    } = handlerInput
    const audioPlayerEventName = requestEnvelope.request.type.split('.')[1]

    const token = handlerInput.requestEnvelope.request.token
    const index = podcast.parseToken(token)
    const episode = await podcast.getEpisodeInfo(podcast.config.ID, index)
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
    const attrs = handlerInput.attributesManager.getRequestAttributes()

    switch (audioPlayerEventName) {
      case 'PlaybackStarted':
        console.log(`PlaybackStarted: ${token}`)
        break
      case 'PlaybackFinished':
        console.log(`PlaybackFinished: ${token}`)
        await attrs.removePersistentOffsetByUrl(episode.url)
        break
      case 'PlaybackStopped':
        console.log(`PlaybackStopped: ${token}`)
        await attrs.setPersistentOffsetByUrl(episode.url, offset)
        break
      case 'PlaybackNearlyFinished':
        console.log(`PlaybackNearlyFinished: ${token}`)
        break
      case 'PlaybackFailed':
        console.log(`PlaybackFailed: ${token}`)
        break
      default:
        throw new Error(`Not implemented yet : ${audioPlayerEventName}`)
    }

    return responseBuilder.getResponse()
  }
}
