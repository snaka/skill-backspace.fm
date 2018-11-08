const { podcast } = require('alexa-podcast-skill-builder')

// podcast設定を適用
Object.assign(podcast.config, require('./constants'))

exports.handler = async (event) => {
  await podcast.getEpisodeInfo(podcast.config.podcastId, 0, false)
}
