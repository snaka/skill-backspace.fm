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
      request.intent.name === 'AMAZON.ResumeIntent'
  },
  async handle (handlerInput) {
    const podcast = new PodcastPlayer(handlerInput)
    await podcast.resume()
    return podcast.response.getResponse()
  }
}
