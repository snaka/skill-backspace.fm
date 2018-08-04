/* eslint-disable  func-names */
/* eslint-disable  no-console */
'use strict'

const Alexa = require('ask-sdk-core')
const util = require('./alexa-utility')
const podcast = require('./podcast')

// ローカライズのためのインターセプター
const LocalizationInterceptor = {
  process (handlerInput) {
    const i18n = require('i18next')
    const sprintf = require('i18next-sprintf-postprocessor')
    const resources = require('./resources')

    const localizationClient = i18n.use(sprintf).init({
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      lng: 'ja-JP',
      resources
    })
    const attributes = handlerInput.attributesManager.getRequestAttributes()

    attributes.t = function (...args) {
      return localizationClient.t(...args)
    }
  }
}

const PlayPodcastIntentHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest' ||
      (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'PlayPodcastIntent')
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    console.log('PLAY PODCAST')

    const token = createToken(podcast.target.ID, 0)
    const episode = await podcast.getEpisodeInfo(podcast.target.ID, 0)
    console.log('episode: ', episode)
    const speechText = t('SPEECH_START_PLAYING_EPISODE', podcast.target.NAME_LOCALIZED, episode.title)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .withSimpleCard(t('CARD_TITLE_START_PLAYING', podcast.target.NAME), speechText)
      .getResponse()
  }
}

const PlayPodcastByIndexIntentHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'PlayPodcastByIndexIntent'
  },
  async handle (handlerInput) {
    console.log('PLAY PODCAST WITH EPISODE NO.')
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const index = util.getSlotValueAsInt(handlerInput.requestEnvelope, 'indexOfEpisodes')
    if (index < 1 || index > podcast.target.MAX_EPISODE_COUNT) {
      console.log('INVALID INDEX:', index)
      const speechText = t('SPEECH_INVALID_EPISODE_INDEX', podcast.target.MAX_EPISODE_COUNT)
      const repromptText = t('PROMPT_INDEX_NUMBER')
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .withSimpleCard(t('CARD_TITLE_INVALID_EPISODE'), speechText)
        .getResponse()
    }
    const episode = await podcast.getEpisodeInfo(podcast.target.ID, index - 1)
    const token = createToken(podcast.target.ID, index - 1)
    const speechText = t('SPEECH_START_PLAYING_EPISODE_AT', podcast.target.NAME_LOCALIZED, index, episode.title)
    const cardText = t('SPEECH_START_PLAYING_EPISODE_AT', podcast.target.NAME, index, episode.title)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .withSimpleCard(t('CARD_TITLE_PLAYING_EPISODE_AT', podcast.target.NAME, index), cardText)
      .getResponse()
  }
}

const StartOverIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.StartOverIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const index = parseToken(token)
    const episode = await podcast.getEpisodeInfo(podcast.target.ID, index)

    console.log(`START OVER: token ${token}`)

    return handlerInput.responseBuilder
      .speak(t('SPEECH_START_OVER'))
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .getResponse()
  }
}

const FastforwardIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'FastforwardIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
    const index = parseToken(token)
    const episode = await podcast.getEpisodeInfo(podcast.target.ID, index)
    const skipMinutes = util.getSlotValueAsInt(handlerInput.requestEnvelope, 'skipMinutes')
    let newOffset = offset + skipMinutes * 60000

    console.log(`FASTFORWARD: token ${token} offset ${offset} skipMinutes ${skipMinutes}`)

    return handlerInput.responseBuilder
      .speak(t('SPEECH_FASTFORWARD_X_MIN', skipMinutes))
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, newOffset)
      .getResponse()
  }
}

const RewindIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'RewindIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
    const index = parseToken(token)
    const episode = await podcast.getEpisodeInfo(podcast.target.ID, index)
    const skipMinutes = util.getSlotValueAsInt(handlerInput.requestEnvelope, 'skipMinutes')
    let newOffset = offset - skipMinutes * 60000
    if (newOffset < 0) newOffset = 0

    console.log(`FASTFORWARD: token ${token} offset ${offset} skipMinutes ${skipMinutes}`)

    return handlerInput.responseBuilder
      .speak(t('SPEECH_REWIND_X_MIN', skipMinutes))
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, newOffset)
      .getResponse()
  }
}

const HelpIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.HelpIntent'
  },
  handle (handlerInput) {
    console.log('HELP')
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const speechText = t('SPEECH_HELP', podcast.target.MAX_EPISODE_COUNT)
    const repromptText = t('PROMPT_INDEX_NUMBER')

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard(t('CARD_TITLE_ABOUT_SKILL'), speechText)
      .getResponse()
  }
}

const CancelAndStopIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent' ||
        request.intent.name === 'AMAZON.PauseIntent')
  },
  handle (handlerInput) {
    console.log(handlerInput.requestEnvelope.context.AudioPlayer)
    const t = handlerInput.attributesManager.getRequestAttributes().t

    const playerActivity = handlerInput.requestEnvelope.context.AudioPlayer.playerActivity
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
    const request = handlerInput.requestEnvelope.request

    if (playerActivity === 'PLAYING') {
      return handlerInput.responseBuilder
        .addAudioPlayerStopDirective()
        .getResponse()
    }

    let speechText
    switch (request.intent.name) {
      case 'AMAZON.CancelIntent':
      case 'AMAZON.StopIntent':
      case 'AMAZON.PauseIntent':
        speechText = t('SPEECH_STOP')
        break
    }

    console.log(`STOP: token ${token} offset ${offset} intent ${request.intent.name}`)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerStopDirective()
      .getResponse()
  }
}

const ResumeIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.ResumeIntent'
  },
  async handle (handlerInput) {
    console.log(handlerInput.requestEnvelope.context.AudioPlayer)

    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds
    const index = parseToken(token)
    const episode = await podcast.getEpisodeInfo(podcast.target.ID, index)

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, offset)
      .getResponse()
  }
}

const NextIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.NextIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const index = parseToken(token)

    const nextIndex = index + 1
    if (nextIndex >= podcast.target.MAX_EPISODE_COUNT) {
      return handlerInput.responseBuilder
        .speak(t('SPEECH_NEXT_EPISODE_NOT_EXIST'))
        .getResponse()
    }

    const nextToken = createToken(podcast.target.ID, nextIndex)
    const episode = await podcast.getEpisodeInfo(podcast.target.ID, nextIndex)
    console.log('NEXT ', nextToken, episode)

    const speechText = t('SPEECH_EPISODE_AT_X_WILL_START', nextIndex + 1, episode.title)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, nextToken, 0)
      .withSimpleCard(t('CARD_TITLE_EPISODE_AT_X', podcast.target.NAME, nextIndex + 1), speechText)
      .getResponse()
  }
}

const PreviousIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.PreviousIntent'
  },
  async handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token
    const index = parseToken(token)

    const nextIndex = index - 1
    if (nextIndex < 0) {
      return handlerInput.responseBuilder
        .speak(t('SPEECH_PREV_EPISODE_NOT_EXIST'))
        .getResponse()
    }

    const nextToken = createToken(podcast.target.ID, nextIndex)
    const episode = await podcast.getEpisodeInfo(podcast.target.ID, nextIndex)
    console.log('PREV ', nextToken, podcast.target.ID, nextIndex, episode)

    const speechText = t('SPEECH_EPISODE_AT_X_WILL_START', nextIndex + 1, episode.title)

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, nextToken, 0)
      .withSimpleCard(t('CARD_TITLE_EPISODE_AT_X', podcast.target.NAME, nextIndex + 1), speechText)
      .getResponse()
  }
}

const UnsupportedIntentHandler = {
  canHandle (handlerInput) {
    const request = handlerInput.requestEnvelope.request

    return request.type === 'IntentRequest' && (
      request.intent.name === 'AMAZON.LoopOnIntent' ||
      request.intent.name === 'AMAZON.LoopOffIntent' ||
      request.intent.name === 'AMAZON.RepeatIntent' ||
      request.intent.name === 'AMAZON.ShuffleOnIntent' ||
      request.intent.name === 'AMAZON.ShuffleOffIntent')
  },
  handle (handlerInput) {
    const t = handlerInput.attributesManager.getRequestAttributes().t

    return handlerInput.responseBuilder
      .speak(t('SPEECH_UNSUPPORTED_INTENT'))
      .getResponse()
  }
}

const AudioPlayerEventHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.')
  },
  handle (handlerInput) {
    const {
      requestEnvelope,
      responseBuilder
    } = handlerInput
    const audioPlayerEventName = requestEnvelope.request.type.split('.')[1]

    console.log('handlerInput: ', handlerInput)

    let token = getToken(handlerInput)

    switch (audioPlayerEventName) {
      case 'PlaybackStarted':
        console.log(`PlaybackStarted: ${token}`)
        break
      case 'PlaybackFinished':
        console.log(`PlaybackFinished: ${token}`)
        break
      case 'PlaybackStopped':
        console.log(`PlaybackStopped: ${token}`)
        break
      case 'PlaybackNearlyFinished':
        console.log(`PlaybackNearlyFinished: ${token}`)
        break
      case 'PlaybackFailed':
        console.log(`PlaybackFailed: ${token}`)
        break
      default:
        throw new Error(`Not implemented yet : ${audioPlayerEventName}`)
    }

    return responseBuilder.getResponse()
  }
}

const SessionEndedRequestHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest'
  },
  handle (handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`)

    return handlerInput.responseBuilder.getResponse()
  }
}

const SystemExceptionHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered'
  },
  handle (handlerInput) {
    console.error(`System exception encountered: ${handlerInput.requestEnvelope.request.reason}`)
  }
}

const ErrorHandler = {
  canHandle () {
    return true
  },
  handle (handlerInput, error) {
    const t = handlerInput.attributesManager.getRequestAttributes().t
    const speechText = t('SPEECH_ERROR_OCCURRED')
    console.log(handlerInput.requestEnvelope.request.intent)
    console.log(`ERROR: ${error.message}`)

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse()
  }
}

function getToken (handlerInput) {
  return handlerInput.requestEnvelope.request.token
}

function createToken (podcastId, episodeIndex) {
  return `${podcastId}:${episodeIndex}`
}

function parseToken (token) {
  const [, index] = token.split(':')
  return parseInt(index)
}

const skillBuilder = Alexa.SkillBuilders.custom()

exports.handler = skillBuilder
  .addRequestInterceptors(
    LocalizationInterceptor
  )
  .addRequestHandlers(
    PlayPodcastIntentHandler,
    PlayPodcastByIndexIntentHandler,
    StartOverIntentHandler,
    FastforwardIntentHandler,
    RewindIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    ResumeIntentHandler,
    NextIntentHandler,
    PreviousIntentHandler,
    UnsupportedIntentHandler,
    AudioPlayerEventHandler,
    SessionEndedRequestHandler,
    SystemExceptionHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda()
