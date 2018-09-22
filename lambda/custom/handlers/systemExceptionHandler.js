module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered'
  },
  handle (handlerInput) {
    console.error(`System exception encountered: ${handlerInput.requestEnvelope.request.reason}`)
  }
}
