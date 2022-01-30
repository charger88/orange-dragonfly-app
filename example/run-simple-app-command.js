const SimpleApp = require('./simple-app')

const app = new SimpleApp(__dirname)

app.processCommand(process.argv).then(() => {})

// For example run: node run-simple-app-command.js random --max=10
