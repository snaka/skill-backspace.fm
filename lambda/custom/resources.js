'use strict'

const fs = require('fs')
const path = require('path')

// const defaultLang = 'ja-JP'
const translations = {}

fs.readdirSync('resources').forEach((file) => {
  const isFile = fs.statSync('./resources/' + file).isFile()
  const isJs = /.*\.js$/.test(file)
  if (!isFile || !isJs) {
    return
  }
  const lang = file.replace('.js', '')
  translations[lang] = require(`./${path.join('resources', file)}`)
})

module.exports = translations
