let PodcastPlayer

module.exports = {
  set PodcastPlayer (clazz) {
    PodcastPlayer = clazz
  },
  get PodcastPlayer () {
    return PodcastPlayer
  },
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.')
  },
  async handle (handlerInput) {
    const {
      requestEnvelope,
      responseBuilder
    } = handlerInput
    const audioPlayerEventName = requestEnvelope.request.type.split('.')[1]
    const podcast = new PodcastPlayer(handlerInput)

    switch (audioPlayerEventName) {
      case 'PlaybackStarted':
        console.log(`PlaybackStarted: ${podcast.nowPlayingToken}`)
        break
      case 'PlaybackFinished':
        console.log(`PlaybackFinished: ${podcast.nowPlayingToken}`)
        await podcast.resetOffset()
        break
      case 'PlaybackStopped':
        console.log(`PlaybackStopped: ${podcast.nowPlayingToken}`)
        await podcast.stop()
        break
      case 'PlaybackNearlyFinished':
        console.log(`PlaybackNearlyFinished: ${podcast.nowPlayingToken}`)
        break
      case 'PlaybackFailed':
        console.log(`PlaybackFailed: ${podcast.nowPlayingToken}`)
        break
      default:
        throw new Error(`Not implemented yet : ${audioPlayerEventName}`)
    }

    return responseBuilder.getResponse()
  }
}
