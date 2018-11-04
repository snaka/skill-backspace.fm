const podcast = require('./podcast')

// podcast設定を適用
Object.assign(podcast.config, require('./constants'))

exports.handler = async (event) => {
  await podcast.getEpisodeInfo(podcast.config.ID, 0, false)
}
