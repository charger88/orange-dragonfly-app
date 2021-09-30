const SimpleApp = require('./simple-app')

const app = new SimpleApp(__dirname)

app.processCommand(process.argv).then(() => {
  console.log((new Date()).toISOString(), 'Command execution finished')
})

// For example run: node run-simple-app-command.js random 10
