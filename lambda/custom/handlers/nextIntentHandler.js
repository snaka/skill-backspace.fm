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
      request.intent.name === 'AMAZON.NextIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const podcast = new PodcastPlayer(handlerInput)

    const nextIndex = podcast.nowPlayingIndex + 1
    if (!PodcastPlayer.isValidIndex(nextIndex)) {
      return handlerInput.responseBuilder
        .speak(t('SPEECH_NEXT_EPISODE_NOT_EXIST'))
        .getResponse()
    }

    await podcast.play(nextIndex)

    const speechText = t('SPEECH_EPISODE_AT_X_WILL_START', nextIndex + 1, podcast.nowPlayingTitle)

    return podcast.response
      .speak(speechText)
      .withSimpleCard(t('CARD_TITLE_EPISODE_AT_X', podcast.name, nextIndex + 1), speechText)
      .getResponse()
  }
}
