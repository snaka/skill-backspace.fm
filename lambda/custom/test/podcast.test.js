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

const mockDynamoDB = {
  _tableName: '',
  _item: {},
  put (obj) {
    this._tableName = obj.TableName
    this._item = obj.Item
    return this
  },
  get () {
    return this
  },
  promise () {
    return Promise.resolve()
  }
}
podcast.__set__('getDynamoDB', () => mockDynamoDB)

beforeEach(() => {
  // XRay関連のメソッドがエラーになるのでstub化する
  podcast.__set__('awsXRay', {
    captureAWS (obj) {
      return obj
    },
    captureAsyncFunc (segmentName, yieldFunc) {
      const stub = {
        close () { }
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
    const saveToCache = podcast.__get__('saveToCache')

    beforeEach(() => {
      mockDynamoDB._tableName = ''
      mockDynamoDB._item = {}
    })

    it('DynamoDB に episodes と headers がキャッシュされる', async () => {
      await saveToCache('podcastA', [{
        published_at: '2018-09-28T00:00:00.000Z',
        title: 'Episode Title #001',
        url: 'https://example.com/episode-001.mp3'
      }], {
        etag: 'abcdefg1234'
      })

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

  describe('restoreFromCache', () => {
    const restoreFromCache = podcast.__get__('restoreFromCache')

    beforeEach(() => {
      mockDynamoDB._item = {
        podcastId: 'cachedPodcast',
        episodes: [{
          published_at: '2018-09-29T00:00:00.000Z',
          title: 'Episode Title #002',
          url: 'https://example.com/episode-002.mp3'
        }],
        headers: {
          etag: 'abcdxyz7890'
        }
      }
      mockDynamoDB.promise = () => Promise.resolve({ Item: mockDynamoDB._item })
    })

    context('forceUseCache が true の場合', () => {
      it('キャッシュを返す', async () => {
        const restored = await restoreFromCache('_podcastId_', '_etag_', true)
        expect(restored).to.have.deep.members([{
          published_at: '2018-09-29T00:00:00.000Z',
          title: 'Episode Title #002',
          url: 'https://example.com/episode-002.mp3'
        }])
      })
    })
    context('etag がキャッシュと一致する場合', () => {
      it('キャッシュを返す', async () => {
        const restored = await restoreFromCache('_podcastId_', 'abcdxyz7890', false)
        expect(restored).to.have.deep.members([{
          published_at: '2018-09-29T00:00:00.000Z',
          title: 'Episode Title #002',
          url: 'https://example.com/episode-002.mp3'
        }])
      })
    })
    context('forceUseCache が false かつ、etag がキャッシュと一致しない場合', () => {
      it('undefined を返す', async () => {
        const restored = await restoreFromCache('_podcastId_', 'INVALID', false)
        expect(restored).to.be.an('undefined')
      })
    })
  })

  describe('createToken', () => {
    it('podcast id と index で token を生成する', () => {
      const token = podcast.createToken(123)
      expect(token).to.equal('podcast-id:123')
    })
  })

  describe('parseToken', () => {
    it('token文字列を:で分割し右側を整数として返す', () => {
      const index = podcast.parseToken('hoge:123')
      expect(index).to.equal(123)
    })
    it('tokenが空の場合は0を返す', () => {
      const index = podcast.parseToken('')
      expect(index).to.equal(0)
    })
  })

  describe('getEpisodeInfo', () => {
    // TODO:テストし辛いので考え直す
  })
})
