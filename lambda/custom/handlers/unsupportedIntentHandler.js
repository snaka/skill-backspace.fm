module.exports = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' && (
      request.intent.name === 'AMAZON.LoopOnIntent' ||
      request.intent.name === 'AMAZON.LoopOffIntent' ||
      request.intent.name === 'AMAZON.RepeatIntent' ||
      request.intent.name === 'AMAZON.ShuffleOnIntent' ||
      request.intent.name === 'AMAZON.ShuffleOffIntent')
  },
  handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    return handlerInput.responseBuilder
      .speak(t('SPEECH_UNSUPPORTED_INTENT'))
      .getResponse()
  }
}
