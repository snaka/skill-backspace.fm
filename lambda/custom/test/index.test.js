/* eslint-env mocha */
const path = require('path')
const nock = require('nock')
const alexaTest = require('alexa-skill-test-framework')

const AWSMOCK = require('aws-sdk-mock')
AWSMOCK.mock('DynamoDB', 'createTable', (params, callback) => {
  console.log('MOCK createTable:', params)
  callback(null, {})
})
AWSMOCK.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
  console.log('MOCK get:', params)
  switch (params.TableName) {
    case 'persistent-store-test':
      callback(null, {
        Item: {
          id: 'hoge',
          attributes: {
            offsetByUrl: {
              'https://example.com/hoge.mp3': 12345
            }
          }
        }
      })
      break
    case 'alexa-skill-podcasts-player':
      callback(null, {
        Item: {
          podcastId: 'hoge',
          timeStamp: 1234567,
          episodes: undefined,
          headers: {
            etag: '"abcdef1234567890"'
          }
        }
      })
      break
    default:
      callback(null, {})
  }
})
AWSMOCK.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
  console.log('MOCK put:', params)
  callback(null, {})
})

alexaTest.initialize(
  require('../index.js'),
  'amzn1.ask.skill.00000000-0000-0000-0000-000000000000',
  'amzn1.ask.account.LONG_STRING',
  'amzn1.ask.device.LONG_STRING'
)
alexaTest.setLocale('ja-JP')
// alexaTest.setDynamoDBTable('alexa-skill-podcasts-player')
alexaTest.setMockContextOptions({ timeout: 5 })

beforeEach(() => {
  // RSSフィードの読み込みをMockに差し替える
  nock('http://feeds.backspace.fm')
    .head('/backspacefm')
    .reply(200, '', {
      'ETag': '__etag__'
    })

  nock('http://feeds.backspace.fm')
    .get('/backspacefm')
    .replyWithFile(200, path.join(__dirname, '/replies/backspace.fm.xml'), { 'Content-Type': 'text/xml; charset=UTF-8' })
})

describe('スキル起動時', () => {
  const request = alexaTest.getLaunchRequest()
  alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:0', 0, 'STOPPED')
  alexaTest.test([
    {
      request,
      saysLike: 'バックスペースエフエム の最新エピソード「Danbo-side #032:コンビニから雑誌が消える　その理由はiTunesとメルカリ」を再生します',
      repromptsNothing: true,
      shouldEndSession: true,
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:0',
        url: 'https://tracking.feedpress.it/link/6091/9900270/backspace-d032.mp3',
        offset: 0
      }
    }
  ], '最新エピソードを再生する')
})

describe('最新エピソードの再生を指示', () => {
  alexaTest.test([
    {
      request: alexaTest.getIntentRequest('PlayPodcastIntent'),
      saysLike: 'バックスペースエフエム の最新エピソード「Danbo-side #032:コンビニから雑誌が消える　その理由はiTunesとメルカリ」を再生します',
      repromptsNothing: true,
      shouldEndSession: true,
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:0',
        url: 'https://tracking.feedpress.it/link/6091/9900270/backspace-d032.mp3',
        offset: 0
      }
    }
  ], '最新エピソードを再生する')
})

describe('番号指定でエピソードを再生', () => {
  context('上限以内の場合', () => {
    alexaTest.test([
      {
        request: alexaTest.getIntentRequest('PlayPodcastByIndexIntent', { indexOfEpisodes: 3 }),
        saysLike: 'バックスペースエフエム の 3 番目のエピソード「#255:アルファ散財フルサイズ」を再生します',
        repromptsNothing: true,
        shouldEndSession: true,
        playsStream: {
          behavior: 'REPLACE_ALL',
          token: 'backspace.fm:2',
          url: 'https://tracking.feedpress.it/link/6091/9852507/backspace-255.mp3',
          offset: 0
        }
      }
    ], '指定された位置のエピソードを再生する')
  })

  context('0番目が指定された場合', () => {
    alexaTest.test([
      {
        request: alexaTest.getIntentRequest('PlayPodcastByIndexIntent', { indexOfEpisodes: 0 }),
        saysLike: 'エピソードの番号は1から500までの数字で指定してください',
        repromptsLike: '何番目のエピソードが聴きたいですか？',
        repromptsNothing: false,
        shouldEndSession: false
      }
    ], 'プロンプトを発話して聞き返す')
  })

  context('101番目が指定された場合', () => {
    alexaTest.test([
      {
        request: alexaTest.getIntentRequest('PlayPodcastByIndexIntent', { indexOfEpisodes: 0 }),
        saysLike: 'エピソードの番号は1から500までの数字で指定してください',
        repromptsLike: '何番目のエピソードが聴きたいですか？',
        repromptsNothing: false,
        shouldEndSession: false
      }
    ], 'プロンプトを発話して聞き返す')
  })
})

describe('先頭からを指示', () => {
  const request = alexaTest.getIntentRequest('AMAZON.StartOverIntent')
  alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:2', 1000)

  alexaTest.test([
    {
      request,
      saysLike: '先頭から再生します',
      shouldEndSession: true,
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:2',
        url: 'https://tracking.feedpress.it/link/6091/9852507/backspace-255.mp3',
        offset: 0
      }
    }
  ], '再生位置を先頭から再生する')
})

describe('早送り', () => {
  const request = alexaTest.getIntentRequest('FastforwardIntent', { 'skipMinutes': 5 })
  alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:0', 60000)

  alexaTest.test([
    {
      request,
      saysLike: '5分進めます',
      shouldEndSession: true,
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:0',
        url: 'https://tracking.feedpress.it/link/6091/9900270/backspace-d032.mp3',
        offset: 360000
      }
    }
  ], '再生位置を5分進める')
})

describe('巻き戻し', () => {
  const request = alexaTest.getIntentRequest('RewindIntent', { 'skipMinutes': 5 })
  alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:0', 360000)

  alexaTest.test([
    {
      request,
      saysLike: '5分戻ります',
      shouldEndSession: true,
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:0',
        url: 'https://tracking.feedpress.it/link/6091/9900270/backspace-d032.mp3',
        offset: 60000
      }
    }
  ], '再生位置を5分戻す')
})

describe('ヘルプ', () => {
  alexaTest.test([
    {
      request: alexaTest.getIntentRequest('AMAZON.HelpIntent'),
      saysLike: 'バックスペースエフエムで配信中の最新から500番目のエピソードを聴くことができます',
      repromptsLike: '何番目のエピソードが聴きたいですか？',
      shouldEndSession: false,
      hasCardTitle: 'backspace.fm プレイヤーについて'
    }
  ], 'ヘルプを発話する')
})

describe('キャンセル', () => {
  const intents = [
    'AMAZON.CancelIntent',
    'AMAZON.StopIntent',
    'AMAZON.PauseIntent'
  ]

  intents.forEach((intent) => {
    context(`インテントが ${intent}`, () => {
      context('再生中', () => {
        const request = alexaTest.getIntentRequest(intent)
        alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:0', 60000, 'PLAYING')

        alexaTest.test([
          {
            request,
            saysNothing: true,
            repromptsNothing: true,
            shouldEndSession: true,
            stopStream: true
          }
        ], '何も発話せずに再生を停止する')
      })

      context('停止中', () => {
        const request = alexaTest.getIntentRequest(intent)
        alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:0', 60000, 'PAUSED')

        alexaTest.test([
          {
            request,
            saysLike: '停止します',
            repromptsNothing: true,
            shouldEndSession: true,
            stopStream: true
          }
        ], '「停止します」と発話して再生を停止する')
      })
    })
  })
})

describe('レジューム', () => {
  const request = alexaTest.getIntentRequest('AMAZON.ResumeIntent')
  alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:0', 60000, 'PAUSED')

  alexaTest.test([
    {
      request,
      saysNothing: true,
      shouldEndSession: true,
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:0',
        url: 'https://tracking.feedpress.it/link/6091/9900270/backspace-d032.mp3',
        offset: 60000
      }
    }
  ], '一時停止していた場所から再生を再開する')
})

describe('次へ', () => {
  context('最後のエピソードではない', () => {
    const request = alexaTest.getIntentRequest('AMAZON.NextIntent')
    alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:0', 60000, 'PLAYING')

    alexaTest.test([
      {
        request,
        saysLike: '2番目のエピソード',
        shouldEndSession: true,
        playsStream: {
          behavior: 'REPLACE_ALL',
          token: 'backspace.fm:1',
          url: 'https://tracking.feedpress.it/link/6091/9882954/backspace-256.mp3',
          offset: 0
        }
      }
    ], '次のエピソードを再生する')
  })

  context('最後のエピソード', () => {
    const request = alexaTest.getIntentRequest('AMAZON.NextIntent')
    alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:499', 60000, 'PLAYING')

    alexaTest.test([
      {
        request,
        saysLike: '次のエピソードはありません',
        shouldEndSession: true,
        playsStoped: true
      }
    ], '「次のエピソードはありません」と発話し再生は停止する')
  })
})

describe('前へ', () => {
  context('最初のエピソードではない', () => {
    const request = alexaTest.getIntentRequest('AMAZON.PreviousIntent')
    alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:1', 60000, 'PLAYING')

    alexaTest.test([
      {
        request,
        saysLike: '1番目のエピソード',
        shouldEndSession: true,
        playsStream: {
          behavior: 'REPLACE_ALL',
          token: 'backspace.fm:0',
          url: 'https://tracking.feedpress.it/link/6091/9900270/backspace-d032.mp3',
          offset: 0
        }
      }
    ], '前のエピソードを再生する')
  })

  context('最初のエピソード', () => {
    const request = alexaTest.getIntentRequest('AMAZON.PreviousIntent')
    alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:0', 60000, 'PLAYING')

    alexaTest.test([
      {
        request,
        saysLike: '前のエピソードはありません',
        repromptsNothing: true,
        shouldEndSession: true,
        playsStoped: true
      }
    ], '「前のエピソードはありません」と発話し再生を停止する')
  })
})

describe('対応していない操作', () => {
  const intents = [
    'AMAZON.LoopOnIntent',
    'AMAZON.LoopOffIntent',
    'AMAZON.RepeatIntent',
    'AMAZON.ShuffleOnIntent',
    'AMAZON.ShuffleOffIntent'
  ]

  intents.forEach((intent) => {
    context(intent, () => {
      alexaTest.test([
        {
          request: alexaTest.getIntentRequest(intent),
          saysLike: 'その操作には対応していません',
          repromptsNothing: true,
          shouldEndSession: true
        }
      ], '「その操作には対応していません」と発話する')
    })
  })
})

describe('AudioPlayerEvent', () => {
  it('PlaybackStarted')
  it('PlaybackNealyFinished')
})

describe('セッション終了', () => {
  it('session ended')
})

describe('エラー', () => {
  it('error')
})
