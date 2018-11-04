'use strict'

const request = require('request')
const FeedParser = require('feedparser')
const awsXRay = require('./my-xray')
const AWS = awsXRay.captureAWS(require('aws-sdk'))

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
})

const targetPodcast = exports.config = {}

function pickSslMediaUrl (enclosures) {
  const sslMedia = enclosures.find(item => item.url.startsWith('https'))
  if (sslMedia) return sslMedia.url

  const nonSslMedia = enclosures[0]
  // Alexa Skill の AudioPlayer は https: で提供されるURLしか対応していないため強引に書き換える
  if (nonSslMedia) return nonSslMedia.url.replace(/^http:/, 'https:')

  throw new Error('Media not found.')
}

async function fetchHead (url) {
  return new Promise((resolve, reject) => {
    awsXRay.captureAsyncFunc('fetchHead', (subsegment) => {
      request.head(url)
        .on('response', (res) => {
          resolve(res)
          subsegment.close()
        })
        .on('error', (err) => {
          reject(err)
          subsegment.close()
        })
    })
  })
}

function getDynamoDB () {
  return new AWS.DynamoDB.DocumentClient()
}

async function saveToCache (podcastId, episodes, headers) {
  const timeStamp = Math.floor((new Date()).getTime() / 1000)
  try {
    console.log(`saveToCache: ${podcastId} => ${targetPodcast.TABLE_NAME}`)
    await getDynamoDB().put({
      TableName: targetPodcast.TABLE_NAME,
      Item: { podcastId, episodes, timeStamp, headers }
    }).promise()
  } catch (e) {
    console.log(e)
  }
}

async function restoreFromCache (podcastId, etag, forceUseCache = false) {
  try {
    console.log(`restoreFromCache: ${targetPodcast.TABLE_NAME} ${podcastId}`)
    const restored = await getDynamoDB().get({ TableName: targetPodcast.TABLE_NAME, Key: { podcastId } }).promise()
    const cachedEtag = (((restored || {}).Item || {}).headers || {}).etag
    if (forceUseCache || cachedEtag === etag) {
      return restored.Item.episodes
    }
    return undefined
  } catch (e) {
    console.error(e)
  }
}

exports.createToken = (episodeIndex) => `${targetPodcast.ID}:${episodeIndex}`

exports.parseToken = (token) => {
  const index = (token || '').split(':')[1]
  return parseInt(index) || 0
}

exports.getEpisodeInfo = (podcastId, index, forceUseCache = true) => {
  return new Promise(async (resolve, reject) => {
    awsXRay.captureAsyncFunc('getEpisodeInfo', async (segGetEpisodeInfo) => {
      if (!targetPodcast) throw new Error('INVALID PODCAST ID')

      let etag = ''
      let head = {}
      if (!forceUseCache) {
        head = await fetchHead(targetPodcast.FEED_URL)
        etag = head.headers.etag
      }

      const cachedFeed = await restoreFromCache(podcastId, etag, forceUseCache)
      if (cachedFeed) {
        resolve(cachedFeed[index])
        if (segGetEpisodeInfo) segGetEpisodeInfo.close()
        return
      }

      console.log('CACHE INVALIDATED')

      const feedparser = new FeedParser()
      const episodes = []
      let resolved = false

      request.get(targetPodcast.FEED_URL)
        .on('error', (err, res) => {
          if (err) {
            console.error(err)
            return
          }
          console.error(`Bad status res ${res} from ${targetPodcast.FEED_URL}`)
          if (res && res.code) {
            reject(new Error(`Bad status ${res.code} from ${targetPodcast.FEED_URL}`))
          }
        }).pipe(feedparser)

      feedparser.on('data', async (data) => {
        // console.log('on data:', data.title)
        if (episodes.length < targetPodcast.MAX_EPISODE_COUNT) {
          const audioUrl = pickSslMediaUrl(data.enclosures)
          episodes.push({
            title: data.title,
            url: audioUrl,
            published_at: data.pubDate.toISOString()
          })
        } else {
          if (!resolved) {
            console.log(`data resolved ${data.title}`)
            resolved = true
            try {
              await saveToCache(podcastId, episodes, head.headers)
              console.log('episodes[index]:', episodes[index])
              resolve(episodes[index])
              if (segGetEpisodeInfo) segGetEpisodeInfo.close()
            } catch (e) {
              console.log(e)
            }
          }
        }
      })

      feedparser.on('end', async () => {
        console.log('on end')
        try {
          await saveToCache(podcastId, episodes, head.headers)
          console.log('episodes[index]:', episodes[index])
          resolve(episodes[index])
          if (segGetEpisodeInfo) segGetEpisodeInfo.close()
        } catch (e) {
          console.log(e)
        }
      })

      feedparser.on('error', () => {
        console.log('on error')
      })
    })
  })
}
