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
        .slots || {})
        [slotName] || {}
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
  }
}
