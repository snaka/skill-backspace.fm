const nock = require('nock');
const alexaTest = require('alexa-skill-test-framework');

nock('http://feeds.backspace.fm')
  .head('/backspacefm')
  .reply(200, '', {
    'ETag': '__etag__'
  });

nock('http://feeds.backspace.fm')
  .get('/backspacefm')
  .replyWithFile(200, __dirname + '/replies/backspace.fm.xml', { 'Content-Type': 'text/xml; charset=UTF-8' });


alexaTest.initialize(
  require('../index.js'),
  'amzn1.ask.skill.00000000-0000-0000-0000-000000000000',
  'amzn1.ask.account.LONG_STRING',
  'amzn1.ask.device.LONG_STRING'
);

alexaTest.setLocale('ja-JP');

alexaTest.setDynamoDBTable('skill-backspace.fm');

describe("スキル起動時", () => {
  alexaTest.test([
    {
      request: alexaTest.getLaunchRequest(),
      saysLike: 'バックスペースエフエム の最新エピソード',
      playStream: { behavior: 'REPLACE_ALL', token: 'backspace.fm:1', offset: 0 }
    }
  ])
});
