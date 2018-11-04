'use strict'

const fs = require('fs')
const path = require('path')

const translations = {}

fs.readdirSync(__dirname).forEach((file) => {
  if (!file.match(/\.js$/)) return
  if (file.match(/^index\.js$/)) return

  const lang = file.replace('.js', '')
  translations[lang] = require(path.join(__dirname, file))
})

module.exports = translations
