const SimpleApp = require('./simple-app')

const app = new SimpleApp(__dirname)

app.start().then(() => {
  console.log((new Date()).toISOString(), 'App started')
})
