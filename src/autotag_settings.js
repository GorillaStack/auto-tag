export default {
  DebugLogging: (process.env.DEBUG_LOGGING === 'Enabled'),
  DebugLoggingOnFailure: (process.env.DEBUG_LOGGING_ON_FAILURE !== 'Disabled'),
  AutoTags: {
    CreateTime: (process.env.CREATE_TIME !== 'Disabled'),
    InvokedBy: (process.env.INVOKED_BY !== 'Disabled')
  },

};
