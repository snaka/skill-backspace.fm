/* eslint-env mocha */
const chai = require('chai')
const rewire = require('rewire')

const expect = chai.expect
const podcast = rewire('../podcast.js')

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
})
