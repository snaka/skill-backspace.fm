'use strict'

const podcast = require('./podcast')

module.exports = class PodcastPlayer {
  static set podcastConfig (config) {
    Object.assign(podcast.config, config)
    Object.freeze(podcast.config)
  }
  static get podcastConfig () {
    return Object.assign({}, podcast.config)
  }
  static isValidIndex (index) {
    return index >= 0 && index < podcast.config.MAX_EPISODE_COUNT
  }
  constructor (handlerInput) {
    this.handlerInput = handlerInput
    this.attrs = () => handlerInput.attributesManager.getRequestAttributes()
    let stateOwner = this
    this.states = {
      STOPPED: {
        buildResponse () {
          return stateOwner.handlerInput.responseBuilder.addAudioPlayerStopDirective()
        }
      },
      PLAYED: {
        buildResponse () {
          return stateOwner.handlerInput.responseBuilder
            .addAudioPlayerPlayDirective('REPLACE_ALL', stateOwner.episode.url, stateOwner.token, stateOwner.offset)
        }
      }
    }
    this.currentState = undefined
  }
  async play (index = 0, offset = undefined) {
    this.token = podcast.createToken(index)
    this.episode = await podcast.getEpisodeInfo(podcast.config.ID, index)
    console.log('play offset:', offset)
    if (typeof offset !== 'undefined') {
      this.offset = offset
    } else {
      this.offset = await this.attrs().getPersistentOffsetByUrl(this.episode.url)
    }
    this.currentState = this.states.PLAYED
  }
  async stop () {
    const nowPlaying = await podcast.getEpisodeInfo(podcast.config.ID, this.nowPlayingIndex)
    await this.attrs().setPersistentOffsetByUrl(nowPlaying.url, this.nowPlayingOffset)

    this.currentState = this.states.STOPPED
  }
  async resetOffset () {
    const nowPlaying = await podcast.getEpisodeInfo(podcast.config.ID, this.nowPlayingIndex)
    await this.attrs().removePersistentOffsetByUrl(nowPlaying.url)
  }
  async fastForward (minutes) {
    const newOffset = this.nowPlayingOffset + minutes * 60000
    await this.play(this.nowPlayingIndex, newOffset)
  }
  async rewind (minutes) {
    let newOffset = this.nowPlayingOffset - minutes * 60000
    if (newOffset < 0) newOffset = 0
    await this.play(this.nowPlayingIndex, newOffset)
  }
  async startOver () {
    await this.play(this.nowPlayingIndex, 0)
  }
  async resume () {
    await this.play(this.nowPlayingIndex, this.nowPlayingOffset)
  }
  get response () {
    return this.currentState.buildResponse()
  }
  get name () {
    return podcast.config.NAME
  }
  get localizedName () {
    return podcast.config.NAME_LOCALIZED
  }
  get nowPlayingTitle () {
    return this.episode.title
  }
  get maxEpisodeCount () {
    return podcast.config.MAX_EPISODE_COUNT
  }
  get nowPlayingToken () {
    return this.handlerInput.requestEnvelope.context.AudioPlayer.token
  }
  get nowPlayingOffset () {
    return this.handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
  }
  get nowPlayingIndex () {
    return podcast.parseToken(this.nowPlayingToken)
  }
  get hasPlayingToken () {
    return !!this.nowPlayingToken
  }
  get isPlaying () {
    return this.handlerInput.requestEnvelope.context.AudioPlayer.playerActivity === 'PLAYING'
  }
}
