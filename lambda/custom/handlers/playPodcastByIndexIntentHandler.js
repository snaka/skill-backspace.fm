const podcast = require('../podcast')

module.exports = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'PlayPodcastByIndexIntent'
  },
  async handle (handlerInput) {
    console.log('PLAY PODCAST WITH EPISODE NO.')
    const attrs = handlerInput.attributesManager.getRequestAttributes()
    const t = attrs.t

    let index
    try {
      index = attrs.getSlotValueAsInt('indexOfEpisodes')
    } catch (e) {
      const speechText = t('SPEECH_INVALID_EPISODE_INDEX', podcast.config.MAX_EPISODE_COUNT)
      const repromptText = t('PROMPT_INDEX_NUMBER')
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .withSimpleCard(t('CARD_TITLE_INVALID_EPISODE'), speechText)
        .getResponse()
    }

    if (index < 1 || index > podcast.config.MAX_EPISODE_COUNT) {
      console.log('INVALID INDEX:', index)
      const speechText = t('SPEECH_INVALID_EPISODE_INDEX', podcast.config.MAX_EPISODE_COUNT)
      const repromptText = t('PROMPT_INDEX_NUMBER')
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .withSimpleCard(t('CARD_TITLE_INVALID_EPISODE'), speechText)
        .getResponse()
    }
    const episode = await podcast.getEpisodeInfo(podcast.config.ID, index - 1)
    const token = podcast.createToken(index - 1)
    const speechText = t('SPEECH_START_PLAYING_EPISODE_AT', podcast.config.NAME_LOCALIZED, index, episode.title)
    const cardText = t('SPEECH_START_PLAYING_EPISODE_AT', podcast.config.NAME, index, episode.title)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .withSimpleCard(t('CARD_TITLE_PLAYING_EPISODE_AT', podcast.config.NAME, index), cardText)
      .getResponse()
  }
}


