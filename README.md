# Orange Dragonfly WebServer

Orange.Dragonfly NodeJS micro-framework

## How to start

First of all you need to create your own application.

Framework doesn't enforce any specific structure, but you can use example (from directory example or from orange-dragonfly-skeleton-app repository).

## How it works

When you run the app it is being initialized and than serves HTTP requests 

### Initialization

On that step controller, models, etc. are being loaded and router is being automatically configured (based on controllers' routes).

Method OrangeDragonflyApp.init configures DB connection, you can override it if you need to do some actions before app is being started.

### Serving HTTP requests

Every request is being routed via router. If it matches some route, requested controller will be invoked in that order:

1. Before-middlewares
2. Custom "before" code
3. Action (like doGetId)
4. Custom "after" code
5. After-middlewares
