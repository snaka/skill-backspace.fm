let podcastConfig

module.exports = {
  set PodcastPlayer (clazz) {
    podcastConfig = clazz.podcastConfig
  },
  get PodcastPlayer () {
    throw new Error('not supported operation.')
  },
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.HelpIntent'
  },
  handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const speechText = t(
      'SPEECH_HELP',
      podcastConfig.SKILL_NAME_LOCALIZED,
      podcastConfig.NAME_LOCALIZED,
      podcastConfig.MAX_EPISODE_COUNT
    )
    const repromptText = t('PROMPT_INDEX_NUMBER')

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard(t('CARD_TITLE_ABOUT_SKILL', podcastConfig.SKILL_NAME), speechText)
      .getResponse()
  }
}
