const podcast = require('podcast')

exports.handler = async (event) => {
  await podcast.getEpisodeInfo(podcast.config.ID, 0, false)
}
