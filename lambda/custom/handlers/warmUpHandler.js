module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.source === 'serverless-plugin-warmup'
  },
  handle (handlerInput) {
    console.log('WarmUP - Lambda is warm!')
  }
}
