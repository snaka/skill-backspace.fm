let PodcastPlayer

module.exports = {
  set PodcastPlayer (clazz) {
    PodcastPlayer = clazz
  },
  get PodcastPlayer () {
    return PodcastPlayer
  },
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.PreviousIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const podcast = new PodcastPlayer(handlerInput)

    const prevIndex = podcast.nowPlayingIndex - 1
    if (!PodcastPlayer.isValidIndex(prevIndex)) {
      return handlerInput.responseBuilder
        .speak(t('SPEECH_PREV_EPISODE_NOT_EXIST'))
        .getResponse()
    }

    await podcast.play(prevIndex)

    const speechText = t('SPEECH_EPISODE_AT_X_WILL_START', prevIndex + 1, podcast.nowPlayingTitle)

    return podcast.response
      .speak(speechText)
      .withSimpleCard(t('CARD_TITLE_EPISODE_AT_X', podcast.name, prevIndex + 1), speechText)
      .getResponse()
  }
}
