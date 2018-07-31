/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const constants = require('./constants');
const util = require('./alexa-utility');
const podcast = require('./podcast');

const PlayPodcastIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'PlayPodcastIntent');
  },
  async handle(handlerInput) {
    console.log('PLAY PODCAST');

    const token = createToken(constants.PODCAST_ID, 0);
    const episode = await podcast.getEpisodeInfo(constants.PODCAST_ID, 0);
    console.log('episode: ', episode);
    const speechText = `${constants.PODCAST_NAME_LOCALIZED} の最新エピソード「${episode.title}」を再生します`;
    const cardText = `${constants.PODCAST_NAME} の最新エピソード「${episode.title}」を再生します`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .withSimpleCard(`${constants.PODCAST_NAME} の最新エピソード`, speechText)
      .getResponse();
  }
};

const PlayPodcastByIndexIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayPodcastByIndexIntent';
  },
  async handle(handlerInput) {
    console.log('PLAY PODCAST WITH EPISODE NO.');

    const index = util.getSlotValueAsInt(handlerInput.requestEnvelope, 'indexOfEpisodes');
    if (index < 0 || index > constants.MAX_EPISODE_COUNT) {
      const speechText = `ごめんなさい、今は最近の${constants.MAX_EPISODE_COUNT}エピソードまでしか対応していません。`;
      return handlerInput.responseBuilder
        .speak(speechText)
        .withSimpleCard('対応していないエピソード', speechText)
        .getResponse();
    }
    const episode = await podcast.getEpisodeInfo(constants.PODCAST_ID, index - 1);
    const token = createToken(constants.PODCAST_ID, index - 1);
    const speechText = `${constants.PODCAST_NAME_LOCALIZED} の ${index} 番目のエピソード「${episode.title}」を再生します`;
    const cardText = `${constants.PODCAST_NAME} の ${index} 番目のエピソード「${episode.title}」を再生します`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .withSimpleCard(`${constants.PODCAST_NAME} の ${index} 番目のエピソード`, cardText)
      .getResponse();
  }
};

const StartOverIntentHandler = {
 canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.StartOverIntent';
  },
  async handle(handlerInput) {
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token;
    const { _id, index } = parseToken(token);
    const episode = await podcast.getEpisodeInfo(constants.PODCAST_ID, index);

    console.log(`START OVER: token ${token}`);

    return handlerInput.responseBuilder
      .speak(`先頭から再生します`)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, 0)
      .getResponse();
  }
};

const FastforwardIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'FastforwardIntent';
  },
  async handle(handlerInput) {
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token;
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds;
    const { _id, index } = parseToken(token);
    const episode = await podcast.getEpisodeInfo(constants.PODCAST_ID, index);
    const skipMinutes = util.getSlotValueAsInt(handlerInput.requestEnvelope, 'skipMinutes');
    let newOffset = offset + skipMinutes * 60000;

    console.log(`FASTFORWARD: token ${token} offset ${offset} skipMinutes ${skipMinutes}`);

    return handlerInput.responseBuilder
      .speak(`${skipMinutes}分進めます`)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, newOffset)
      .getResponse();
  }
};

const RewindIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'RewindIntent';
  },
  async handle(handlerInput) {
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token;
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds;
    const { _id, index } = parseToken(token);
    const episode = await podcast.getEpisodeInfo(constants.PODCAST_ID, index);
    const skipMinutes = util.getSlotValueAsInt(handlerInput.requestEnvelope, 'skipMinutes');
    let newOffset = offset - skipMinutes * 60000;
    if (newOffset < 0) newOffset = 0;

    console.log(`FASTFORWARD: token ${token} offset ${offset} skipMinutes ${skipMinutes}`);

    return handlerInput.responseBuilder
      .speak(`${skipMinutes}分戻ります`)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, newOffset)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    console.log('HELP');
    const speechText = 'バックスペースエフエムプレイヤーではバックスペースエフエムのエピソードを再生することができます。どのエピソードが聞きたいですか？\n \
たとえば「最新のエピソード」または「２番目のエピソード」と話しかけてみてください';
    const repromptText = 'たとえば「最新のエピソード」または「２番目のエピソード」と話しかけてみてください';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard('backspace.fm プレイヤーについて', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent'
        || request.intent.name === 'AMAZON.PauseIntent');
  },
  handle(handlerInput) {
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token;
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds;
    console.log(`STOP: token ${token} offset ${offset}`);

    const request = handlerInput.requestEnvelope.request;
    let speechText;
    switch(request.intent.name) {
      case 'AMAZON.CancelIntent':
        speechText = 'キャンセルします';
        break;
      case 'AMAZON.StopIntent':
        speechText = '停止します';
        break;
      case 'AMAZON.PauseIntent':
        speechText = '一時停止します';
        break;
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerStopDirective()
      .getResponse();
  }
};

const ResumeIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.ResumeIntent';
  },
  async handle(handlerInput) {
    console.log(handlerInput.requestEnvelope.context.AudioPlayer);

    const token = handlerInput.requestEnvelope.context.AudioPlayer.token;
    const offset = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds;
    const { _id, index } = parseToken(token);
    const episode = await podcast.getEpisodeInfo(constants.PODCAST_ID, index);

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, token, offset)
      .getResponse();
  }
};

const NextIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.NextIntent';
  },
  async handle(handlerInput) {
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token;
    const { _id, index } = parseToken(token);

    const nextIndex = index + 1;
    if (nextIndex >= constants.MAX_EPISODE_COUNT) {
      return handlerInput.responseBuilder
        .speak('次のエピソードはありません')
        .getResponse();
    }

    const podcastName = util.getResolvedValueName(handlerInput.requestEnvelope, 'podcastName');
    const nextToken = createToken(constants.PODCAST_ID, nextIndex);
    const episode = await podcast.getEpisodeInfo(constants.PODCAST_ID, nextIndex)
    console.log('NEXT ', nextToken, episode);

    const speechText = `${nextIndex + 1}番目のエピソード「${episode.title}」を再生します`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, nextToken, 0)
      .withSimpleCard(`${constants.PODCAST_NAME} の ${nextIndex + 1} 番目のエピソード`, speechText)
      .getResponse();
  }
}

const PreviousIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.PreviousIntent';
  },
  async handle(handlerInput) {
    const token = handlerInput.requestEnvelope.context.AudioPlayer.token;
    const { _id, index } = parseToken(token);

    const nextIndex = index - 1;
    if (nextIndex < 0) {
      return handlerInput.responseBuilder
        .speak('前のエピソードはありません')
        .getResponse();
    }

    const podcastName = util.getResolvedValueName(handlerInput.requestEnvelope, 'podcastName');
    const nextToken = createToken(constants.PODCAST_ID, nextIndex);
    const episode = await podcast.getEpisodeInfo(constants.PODCAST_ID, nextIndex)
    console.log('PREV ', nextToken, constants.PODCAST_ID, nextIndex, episode);

    const speechText = `${nextIndex + 1}番目のエピソード「${episode.title}」を再生します`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .addAudioPlayerPlayDirective('REPLACE_ALL', episode.url, nextToken, 0)
      .withSimpleCard(`${constants.PODCAST_NAME} の ${nextIndex + 1} 番目のエピソード`, speechText)
      .getResponse();
  }
}

const UnsupportedIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest' && (
      request.intent.name === 'AMAZON.LoopOnIntent' ||
      request.intent.name === 'AMAZON.LoopOffIntent' ||
      request.intent.name === 'AMAZON.RepeatIntent' ||
      request.intent.name === 'AMAZON.ShuffleOnIntent' ||
      request.intent.name === 'AMAZON.ShuffleOffIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('すみません、その操作には対応していません')
      .getResponse();
  }
}

const AudioPlayerEventHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.');
  },
  handle(handlerInput) {
    const {
      requestEnvelope,
      responseBuilder
    } = handlerInput;
    const audioPlayerEventName = requestEnvelope.request.type.split('.')[1];

    console.log('handlerInput: ', handlerInput);

    let token = getToken(handlerInput);

    switch (audioPlayerEventName) {
      case 'PlaybackStarted':
        console.log(`PlaybackStarted: ${token}`);
        break;
      case 'PlaybackFinished':
        console.log(`PlaybackFinished: ${token}`);
        break;
      case 'PlaybackStopped':
        console.log(`PlaybackStopped: ${token}`);
        break;
      case 'PlaybackNearlyFinished':
        console.log(`PlaybackNearlyFinished: ${token}`);
        break;
      case 'PlaybackFailed':
        console.log(`PlaybackFailed: ${token}`);
        break;
      default:
        throw new Error(`Not implemented yet : ${audioPlayerEventName}`);
    }

    return responseBuilder.getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const SystemExceptionHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type == 'System.ExceptionEncountered';
  },
  handle(handlerInput) {
    console.error(`System exception encountered: ${handlerInput.requestEnvelope.request.reason}`);
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const speechText = 'ごめんなさい、よく理解できませんでした。';
    console.log(handlerInput.requestEnvelope.request.intent);
    console.log(`ERROR: ${error.message}`);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

function getToken(handlerInput) {
  return handlerInput.requestEnvelope.request.token;
}

function createToken(podcastId, episodeIndex) {
  return `${podcastId}:${episodeIndex}`;
}

function parseToken(token) {
  const [podcastId, index] = token.split(':');
  return {
    podcastId: podcastId,
    index: parseInt(index)
  };
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
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
  .lambda();
