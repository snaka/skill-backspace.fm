exports.getResolvedValueName = function (envelope, slotName) {
  if (
    envelope &&
    envelope.request &&
    envelope.request.intent &&
    envelope.request.intent.slots &&
    envelope.request.intent.slots[slotName] &&
    envelope.request.intent.slots[slotName].resolutions &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0] &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values[0] &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values[0].value &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values[0].value.name) {
    return envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values[0].value.name
  } else {
    return undefined
  }
}

exports.getResolvedValueId = function (envelope, slotName) {
  if (
    envelope &&
    envelope.request &&
    envelope.request.intent &&
    envelope.request.intent.slots &&
    envelope.request.intent.slots[slotName] &&
    envelope.request.intent.slots[slotName].resolutions &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0] &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values[0] &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values[0].value &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values[0].value.id) {
    return envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values[0].value.id
  } else {
    return undefined
  }
}

exports.getSlotValueAsInt = function (envelope, slotName) {
  if (
    envelope &&
    envelope.request &&
    envelope.request.intent &&
    envelope.request.intent.slots &&
    envelope.request.intent.slots[slotName] &&
    envelope.request.intent.slots[slotName].value) {
    return parseInt(envelope.request.intent.slots[slotName].value)
  } else {
    return 0
  }
}

exports.getPlayingIndex = function (context) {
  if (context &&
    context.AudioPlayer &&
    context.AudioPlayer.token) {
    return parseInt(context.AudioPlayer.token)
  } else {
    return undefined
  }
}
