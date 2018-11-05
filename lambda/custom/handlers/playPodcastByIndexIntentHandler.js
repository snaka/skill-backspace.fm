let PodcastPlayer

module.exports = {
  set PodcastPlayer (clazz) {
    PodcastPlayer = clazz
  },
  get PodcastPlayer () {
    return PodcastPlayer
  },
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'PlayPodcastByIndexIntent'
  },
  async handle (handlerInput) {
    console.log('PLAY PODCAST WITH EPISODE NO.')
    const attrs = handlerInput.attributesManager.getRequestAttributes()
    const t = attrs.t
    const podcast = new PodcastPlayer(handlerInput)

    let position
    try {
      position = attrs.getSlotValueAsInt('indexOfEpisodes')
    } catch (e) {
      const speechText = t('SPEECH_INVALID_EPISODE_INDEX', podcast.maxEpisodeCount)
      const repromptText = t('PROMPT_INDEX_NUMBER')
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .withSimpleCard(t('CARD_TITLE_INVALID_EPISODE'), speechText)
        .getResponse()
    }

    const index = position - 1
    if (!PodcastPlayer.isValidIndex(index)) {
      const speechText = t('SPEECH_INVALID_EPISODE_INDEX', podcast.maxEpisodeCount)
      const repromptText = t('PROMPT_INDEX_NUMBER')
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .withSimpleCard(t('CARD_TITLE_INVALID_EPISODE'), speechText)
        .getResponse()
    }

    await podcast.play(index)

    const speechText = t('SPEECH_START_PLAYING_EPISODE_AT', podcast.localizedName, position, podcast.nowPlayingTitle)
    const cardText = t('SPEECH_START_PLAYING_EPISODE_AT', podcast.name, position, podcast.nowPlayingTitle)

    return podcast.response
      .speak(speechText)
      .withSimpleCard(t('CARD_TITLE_PLAYING_EPISODE_AT', podcast.name, position), cardText)
      .getResponse()
  }
}
