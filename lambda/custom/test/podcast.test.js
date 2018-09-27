/* eslint-env mocha */
const chai = require('chai')
const rewire = require('rewire')
const nock = require('nock')

const expect = chai.expect
const podcast = rewire('../podcast.js')

const stubConfig = {
  FEED_URL: 'http://feed.example.com/podcast',
  TABLE_NAME: 'dynamodb-test',
  ID: 'podcast-id',
  NAME: 'podcast name',
  NAME_LOCALIZED: 'ポッドキャスト',
  MAX_EPISODE_COUNT: 10
}
podcast.__set__('targetPodcast', stubConfig)
podcast.__set__('exports.config', stubConfig)

beforeEach(() => {
  // XRay関連のメソッドがエラーになるのでstub化する
  podcast.__set__('awsXRay', {
    captureAWS(obj) {
      return obj
    },
    captureAsyncFunc(segmentName, yieldFunc) {
      const stub = {
        close() { }
      }
      yieldFunc(stub)
    }
  })
})

describe('podcast module', () => {
  describe('pickSslMeidaUrl', () => {
    const pickSslMediaUrl = podcast.__get__('pickSslMediaUrl')

    context('enclosures に URL が含まれている', () => {
      context('enclosures に https で始まる URL が含まれている', () => {
        const enclosures = [
          { url: 'http://example.com/ep001.mp3' },
          { url: 'https://example.com/ep001.mp3' }
        ]
        it('https で始まる URL を返す', () => {
          expect(pickSslMediaUrl(enclosures)).to.equal('https://example.com/ep001.mp3')
        })
      })
      context('enclosures に https で始まる URL が含まれていない', () => {
        const enclosures = [
          { url: 'http://example.com/ep001.mp3' },
          { url: 'https://example.com/ep001.mp3' }
        ]
        it('http の URL を https に書き換えたものを返す', () => {
          expect(pickSslMediaUrl(enclosures)).to.equal('https://example.com/ep001.mp3')
        })
      })
    })
    context('enclousres に URL が含まれていない', () => {
      const enclosures = []
      it('例外を投げる', () => {
        expect(() => pickSslMediaUrl(enclosures)).to.throw(Error, /not found/)
      })
    })
  })

  describe('fetchHead', () => {
    const fetchHead = podcast.__get__('fetchHead')

    context('リモートから正常のレスポンスが返ってくる場合', () => {
      nock('http://feed.example.com')
        .head('/podcast')
        .reply(200, '', {
          'ETag': '__etag__'
        })

      it('HEAD のレスポンスを返す', async () => {
        const head = await fetchHead('http://feed.example.com/podcast')
        expect(head.statusCode).to.equal(200)
        expect(head.headers.etag).to.equal('__etag__')
      })
    })

    context('リモートからエラーが返ってくる場合', () => {
      nock('http://feed.example.com')
        .head('/podcast')
        .reply(404, '', { })

      it('エラーを返す', async () => {
        const head = await fetchHead('http://feed.example.com/podcast')
        expect(head.statusCode).to.equal(404)
      })
    })
  })

  describe('saveToCache', () => {
    const mockDynamoDB = {
      _tableName: '',
      _item: {},
      put(obj) {
        this._tableName = obj.TableName
        this._item = obj.Item
        return this
      },
      promise() {
        return Promise.resolve()
      }
    }
    const saveToCache = podcast.__get__('saveToCache')

    beforeEach(() => {
      mockDynamoDB._tableName = ''
      mockDynamoDB._item = {}
      podcast.__set__('getDynamoDB', () => mockDynamoDB)
    })

    it('DynamoDB に episodes と headers がキャッシュされる', async () => {
      await saveToCache('podcastA', [{
          published_at: '2018-09-28T00:00:00.000Z',
          title: 'Episode Title #001',
          url: 'https://example.com/episode-001.mp3'
        }], {
          etag: 'abcdefg1234'
        }
      )

      expect(mockDynamoDB._tableName).to.equal(stubConfig.TABLE_NAME)
      expect(mockDynamoDB._item).to.deep.include({
        podcastId: 'podcastA',
        episodes: [{
            published_at: '2018-09-28T00:00:00.000Z',
            title: 'Episode Title #001',
            url: 'https://example.com/episode-001.mp3'
        }],
        headers: {
          etag: 'abcdefg1234'
        }
      })
    })
  })
})
