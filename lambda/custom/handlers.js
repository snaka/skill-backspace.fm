const path = require('path')
const basePath = path.join(__dirname, 'handlers');

const exts = {}

require('fs').readdirSync(basePath).forEach(file => {
  if (!file.match(/\.js$/)) return
  let exportedObject = require(path.join(__dirname, 'handlers', file))
  let exportedName = path.basename(file, '.js')
  exts[exportedName] = exportedObject
})

module.exports = exts
