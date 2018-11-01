class InvalidSlotValueError extends Error {}

module.exports = {
  process (handlerInput) {
    const attributes = handlerInput.attributesManager.getRequestAttributes()
    attributes.getSlotValueAsInt = (slotName) => {
      if (!slotName) {
        throw new Error('`slotName` is required.')
      }
      const slotValue = (((((
        handlerInput.requestEnvelope || {})
        .request || {})
        .intent || {})
        .slots || {})[slotName] || {}
      ).value
      if (slotValue) {
        const parsedInt = parseInt(slotValue)
        if (!Number.isInteger(parsedInt)) {
          throw new InvalidSlotValueError(`slotName: ${slotName}'s value '${parsedInt}' is not integer.`)
        }
        return parsedInt
      } else {
        return 0
      }
    }
    const getPersistentAttrs = async () => {
      let attrs = await handlerInput.attributesManager.getPersistentAttributes()
      if (Object.keys(attrs).length === 0) {
        attrs = {
          offsetByUrl: {}
        }
      }
      return attrs
    }
    const setPersistentAttrs = (attrs) => {
      handlerInput.attributesManager.setPersistentAttributes(attrs)
    }
    attributes.getPersistentOffsetByUrl = async (sourceUrl) => {
      const attrs = await getPersistentAttrs()
      return parseInt(attrs.offsetByUrl[sourceUrl]) || 0
    }
    attributes.setPersistentOffsetByUrl = async (sourceUrl, offset) => {
      const attrs = await getPersistentAttrs()
      attrs.offsetByUrl[sourceUrl] = offset
      setPersistentAttrs(attrs)
    }
    attributes.removePersistentOffsetByUrl = async (sourceUrl) => {
      const attrs = await getPersistentAttrs()
      delete attrs.offsetByUrl[sourceUrl]
      setPersistentAttrs(attrs)
    }
  }
}
