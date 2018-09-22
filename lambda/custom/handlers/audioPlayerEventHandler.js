module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.')
  },
  handle (handlerInput) {
    const {
      requestEnvelope,
      responseBuilder
    } = handlerInput
    const audioPlayerEventName = requestEnvelope.request.type.split('.')[1]

    let token = getToken(handlerInput)

    switch (audioPlayerEventName) {
      case 'PlaybackStarted':
        console.log(`PlaybackStarted: ${token}`)
        break
      case 'PlaybackFinished':
        console.log(`PlaybackFinished: ${token}`)
        break
      case 'PlaybackStopped':
        console.log(`PlaybackStopped: ${token}`)
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
