module.exports = (function () {
  if (process.env.DISABLE_XRAY) {
    const mock = {
      captureAWS (obj) {
        return obj
      },
      captureAsyncFunc (segmentName, asyncFunc) {
        const mockSubSegment = {
          close () { /* do nothing */ }
        }
        asyncFunc(mockSubSegment)
      }
    }
    return mock
  } else {
    return require('aws-xray-sdk')
  }
})()
