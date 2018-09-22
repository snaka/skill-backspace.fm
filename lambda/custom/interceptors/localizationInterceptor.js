const i18n = require('i18next')
const sprintf = require('i18next-sprintf-postprocessor')
const resources = require('../resources')

module.exports = {
  process (handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      lng: 'ja-JP',
      resources
    })
    const attributes = handlerInput.attributesManager.getRequestAttributes()

    attributes.t = function (...args) {
      return localizationClient.t(...args)
    }
  }
}
