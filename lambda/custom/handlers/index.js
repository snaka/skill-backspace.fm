const path = require('path')

const exts = {}

require('fs').readdirSync(__dirname).forEach(file => {
  if (!file.match(/\.js$/)) return
  let exportedObject = require(path.join(__dirname, file))
  let exportedName = path.basename(file, '.js')
  exts[exportedName] = exportedObject
})

module.exports = exts
