const request = require('request')
const FeedParser = require('feedparser')
const AWS = require('aws-sdk')
const constants = require('./constants')

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
})
const dynamoDb = new AWS.DynamoDB.DocumentClient()

const podcasts = {
  'turingcomplete.fm': {
    displayName: 'TURING COMPLETE FM',
    pronunciation: 'チューリングコンプリートエフエム',
    feedUrl: 'https://feeds.turingcomplete.fm/tcfm'
  },
  'backspace.fm': {
    displayName: 'backspace.fm',
    pronunciation: 'バックスペースエフエム',
    feedUrl: 'http://feeds.backspace.fm/backspacefm'
  },
  'mozaic.fm': {
    displayName: 'mozaic.fm',
    pronunciation: 'モザイクエフエム',
    feedUrl: 'http://feed.mozaic.fm/'
  }
}

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
    request.head(url)
      .on('response', (res) => {
        resolve(res)
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

async function saveToCache (podcastId, episodes, headers) {
  const timeStamp = Math.floor((new Date()).getTime() / 1000)
  try {
    console.log(`saveToCache: ${podcastId} => ${constants.TABLE_NAME}`)
    await dynamoDb.put({
      TableName: constants.TABLE_NAME,
      Item: { podcastId, episodes, timeStamp, headers }
    }).promise()
  } catch (e) {
    console.log(e)
  }
}

async function restoreFromCache (podcastId, etag) {
  try {
    console.log(`restoreFromCache: ${constants.TABLE_NAME} ${podcastId}`)
    const restored = await dynamoDb.get({ TableName: constants.TABLE_NAME, Key: { podcastId } }).promise()
    // console.log(`restored: ${JSON.stringify(restored)}`);
    if (restored.Item.headers.etag !== etag) {
      console.log(`ETag changed cache:${restored.Item.headers.etag} !== current:${etag}`)
      return undefined
    }
    return restored.Item.episodes
  } catch (e) {
    console.error(e)
  }
}

exports.availableDisplayName = () => {
  const results = []
  for (let podcastId in podcasts) {
    results.push(podcasts[podcastId].displayName)
  }
  return results
}

exports.availablePronunciation = () => {
  const results = []
  for (let podcastId in podcasts) {
    results.push(podcasts[podcastId].pronunciation)
  }
  return results
}

exports.getEpisodeInfo = (podcastId, index) => {
  return new Promise(async (resolve, reject) => {
    const targetPodcast = podcasts[podcastId]
    if (!targetPodcast) throw new Error('INVALID PODCAST ID')

    const head = await fetchHead(targetPodcast.feedUrl)

    const cachedFeed = await restoreFromCache(podcastId, head.headers.etag)
    if (cachedFeed) {
      resolve(cachedFeed[index])
      return
    }

    const feedparser = new FeedParser()
    const episodes = []
    let resolved = false

    request.get(targetPodcast.feedUrl)
      .on('error', (err, res) => {
        console.error(`Bad status res ${res} from ${targetPodcast.feedUrl}`)
        if (res && res.code) {
          reject(`Bad status ${res.code} from ${targetPodcast.feedUrl}`)
        }
      }).pipe(feedparser)

    feedparser.on('data', async (data) => {
      if (episodes.length < constants.MAX_EPISODE_COUNT) {
        const audioUrl = pickSslMediaUrl(data.enclosures)
        episodes.push({
          title: data.title,
          url: audioUrl,
          published_at: data.pubDate.toISOString()
        })
      } else {
        if (!resolved) {
          try {
            console.log(`data resolved ${data.title}`)
            resolved = true
            await saveToCache(podcastId, episodes, head.headers)
            console.log('episodes[index]:', episodes[index])
            resolve(episodes[index])
          } catch (e) {
            console.log(e)
          }
        }
      }
    })
  })
}
