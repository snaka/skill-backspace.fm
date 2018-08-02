const nock = require('nock');
const alexaTest = require('alexa-skill-test-framework');

alexaTest.initialize(
  require('../index.js'),
  'amzn1.ask.skill.00000000-0000-0000-0000-000000000000',
  'amzn1.ask.account.LONG_STRING',
  'amzn1.ask.device.LONG_STRING'
);
alexaTest.setLocale('ja-JP');

beforeEach(() => {
  // RSSフィードの読み込みをMockに差し替える
  nock('http://feeds.backspace.fm')
    .head('/backspacefm')
    .reply(200, '', {
      'ETag': '__etag__'
    });

  nock('http://feeds.backspace.fm')
    .get('/backspacefm')
    .replyWithFile(200, __dirname + '/replies/backspace.fm.xml', { 'Content-Type': 'text/xml; charset=UTF-8' });
});

alexaTest.setDynamoDBTable('skill-backspace.fm');

describe("スキル起動時", () => {
  alexaTest.test([
    {
      request: alexaTest.getLaunchRequest(),
      saysLike: 'バックスペースエフエム の最新エピソード',
      repromptsNothing: true,
      shouldEndSession: true,
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:0',
        url: 'https://tracking.feedpress.it/link/6091/9900270/backspace-d032.mp3',
        offset: 0
      }
    }
  ]);
});

describe('最新エピソードの再生を指示', () => {
  alexaTest.test([
    {
      request: alexaTest.getIntentRequest('PlayPodcastIntent'),
      saysLike: 'バックスペースエフエム の最新エピソード',
      repromptsNothing: true,
      shouldEndSession: true,
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:0',
        url: 'https://tracking.feedpress.it/link/6091/9900270/backspace-d032.mp3',
        offset: 0
      }
    }
  ]);
});

describe('番号指定でエピソードを再生', () => {
  context('上限以内の場合', () => {
    alexaTest.test([
      {
        request: alexaTest.getIntentRequest('PlayPodcastByIndexIntent', { indexOfEpisodes: 3 }),
        saysLike: 'バックスペースエフエム の 3 番目のエピソード',
        playsStream: {
          behavior: 'REPLACE_ALL',
          token: 'backspace.fm:2',
          url: 'https://tracking.feedpress.it/link/6091/9852507/backspace-255.mp3',
          offset: 0
        }
      }
    ]);
  });

  context('0番目が指定された場合', () => {
    alexaTest.test([
      {
        request: alexaTest.getIntentRequest('PlayPodcastByIndexIntent', { indexOfEpisodes: 0 }),
        saysLike: '最近の100エピソードまでしか対応していません'
      }
    ]);
  });

  context('101番目が指定された場合', () => {
    alexaTest.test([
      {
        request: alexaTest.getIntentRequest('PlayPodcastByIndexIntent', { indexOfEpisodes: 0 }),
        saysLike: '最近の100エピソードまでしか対応していません'
      }
    ]);
  });
});

describe('先頭からを指示', () => {
  const request = alexaTest.getIntentRequest('AMAZON.StartOverIntent');
  alexaTest.addAudioPlayerContextToRequest(request, 'backspace.fm:2', 1000);

  alexaTest.test([
    {
      request,
      saysLike: '先頭から再生します',
      playsStream: {
        behavior: 'REPLACE_ALL',
        token: 'backspace.fm:2',
        url: 'https://tracking.feedpress.it/link/6091/9852507/backspace-255.mp3',
        offset: 0
      }
    }
  ]);
});

