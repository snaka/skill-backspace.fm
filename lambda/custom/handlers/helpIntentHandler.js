const podcast = require('../podcast')
Object.assign(podcast.config, require('../constants'))

module.exports = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.HelpIntent'
  },
  handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const speechText = t('SPEECH_HELP', podcast.config.MAX_EPISODE_COUNT)
    const repromptText = t('PROMPT_INDEX_NUMBER')

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard(t('CARD_TITLE_ABOUT_SKILL'), speechText)
      .getResponse()
  }
}
