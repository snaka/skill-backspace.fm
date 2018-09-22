module.exports = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent' ||
        request.intent.name === 'AMAZON.PauseIntent')
  },
  handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const playerActivity = handlerInput.requestEnvelope.context.AudioPlayer.playerActivity
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
    const request = handlerInput.requestEnvelope.request

    if (playerActivity === 'PLAYING') {
      return handlerInput.responseBuilder
        .addAudioPlayerStopDirective()
        .getResponse()
    }

    let speechText
    switch (request.intent.name) {
      case 'AMAZON.CancelIntent':
      case 'AMAZON.StopIntent':
      case 'AMAZON.PauseIntent':
        speechText = t('SPEECH_STOP')
        break
    }

    console.log(`STOP: token ${token} offset ${offset} intent ${request.intent.name}`)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerStopDirective()
      .getResponse()
  }
}
