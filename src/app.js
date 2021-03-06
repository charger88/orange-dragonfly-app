const { OrangeDragonflyWebServer, OrangeDragonflyResponse } = require('orange-dragonfly-web-server')
const { OrangeDragonflyRouter } = require('orange-dragonfly-router')
const OrangeDragonflyORMModelToSQL = require('orange-dragonfly-orm-model-to-sql')
const OrangeDragonflyErrorController = require('./errors-controller')
const OrangeDragonflyAbstractModel = require('orange-dragonfly-model')
const { AbstractQuery } = require('orange-dragonfly-orm')
const path = require('path')
const Helpers = require('./helpers')

/**
 * Orange Dragonfly Web Application
 */
class OrangeDragonflyApp {
  /**
   * @param {string} dirname Project root directory (__dirname)
   * @param {object} config
   */
  constructor (dirname, config = {}) {
    this._dirname = dirname
    this._config = config
    this._router = OrangeDragonflyRouter.init()
    this._router.registerDefault({ Controller: this.errorsController, action: 'e404' })
    for (const model of this.models) {
      OrangeDragonflyAbstractModel.registerModel(model)
    }
    this._registeredMiddlewares = {}
    for (const middleware of this.middlewares) {
      this._registeredMiddlewares[middleware.name] = middleware
    }
    this.optionPaths = {}
    for (const controller of this.controllers) {
      for (const route of controller.routes.filter(r => !!r.path)) {
        this._router.register(route.path, [route.method], { Controller: controller, action: route.action, path: route.path })
        if (!this.optionPaths[route.path]) {
          this.optionPaths[route.path] = []
          this._router.register(route.path, ['OPTIONS'], { Controller: controller, action: 'genericOptionsAction', path: route.path })
        }
        this.optionPaths[route.path].push(route.method)
      }
    }
    this._registeredCommands = {}
    for (const command of this.commands) {
      this._registeredCommands[command.commandName] = command
    }
  }

  /**
   * Errors controller
   * @return {OrangeDragonflyErrorsController}
   */
  get errorsController () {
    return OrangeDragonflyErrorController
  }

  /**
   * Returns middleware by name
   * @param {string} middlewareClassName
   * @return {Class}
   */
  getMiddleware (middlewareClassName) {
    if (!this._registeredMiddlewares[middlewareClassName]) {
      throw new Error(`Middleware ${middlewareClassName} is not registered`)
    }
    return this._registeredMiddlewares[middlewareClassName]
  }

  /**
   * Config
   * @return {object}
   */
  get config () {
    return this._config
  }

  /**
   * Returns true if CORS headers should be returned
   * @return {boolean}
   */
  get cors () {
    return false
  }

  /**
   * Router
   * @return {object}
   */
  get router () {
    return this._router
  }

  /**
   * List of available models
   * @return {OrangeDragonflyAbstractModel[]}
   */
  get models () {
    return Helpers.loadClassesFromDirRecursively(path.join(this._dirname, 'models'))
  }

  /**
   * List of available middlewares
   * @return {OrangeDragonflyMiddleware[]}
   */
  get middlewares () {
    return Helpers.loadClassesFromDirRecursively(path.join(this._dirname, 'middlewares'))
  }

  /**
   * List of available controllers
   * @return {OrangeDragonflyController[]}
   */
  get controllers () {
    return Helpers.loadClassesFromDirRecursively(path.join(this._dirname, 'controllers'))
  }

  /**
   * List of available controllers
   * @return {OrangeDragonflyController[]}
   */
  get commands () {
    return Helpers.loadClassesFromDirRecursively(path.join(this._dirname, 'commands'))
  }

  /**
   * Web server errors' handler
   * @param {OrangeDragonflyRequest} request
   * @param {Error} e
   */
  processWebServerError (request, e) {
    console.error('WebServer', request, e)
  }

  /**
   * Access log function
   * @param {OrangeDragonflyRequest} request
   * @param {OrangeDragonflyResponse} response
   */
  accessLog (request, response) {}

  /**
   * DB Driver class (Orange Dragonfly ORM)
   * @return {null|class}
   */
  get dbDriver () {
    return null
  }

  /**
   * Return config parameter
   * @param {string} parameter Name
   * @param {*} def Default value
   * @return {*}
   */
  getConfig (parameter, def = null) {
    return Object.prototype.hasOwnProperty.call(this._config, parameter) ? this._config[parameter] : def
  }

  /**
   * Initializes application
   * @return {Promise<void>}
   */
  async init () {
    const DbDriver = this.dbDriver
    if (DbDriver) {
      const dbConfig = this.getConfig('db')
      if (dbConfig) {
        AbstractQuery.registerDB(new DbDriver(dbConfig))
      } else {
        console.error('Database config not found')
      }
    }
  }

  /**
   * Unloads (de-initializes) application
   * @return {Promise<void>}
   */
  async unload () {
    const DbDriver = this.dbDriver
    if (DbDriver) {
      const dbConfig = this.getConfig('db')
      if (dbConfig) {
        AbstractQuery.releaseDB()
      } else {
        console.error('Database config not found')
      }
    }
  }

  /**
   * Start application
   * @return {Promise<boolean>}
   */
  async start () {
    await this.init()
    const server = new OrangeDragonflyWebServer(this.config.port || 8888, this.processWebServerError, this.config.host || '0.0.0.0')
    return await server.start(request => {
      return this.processRequest(request)
    })
  }

  /**
   * Process request via the application
   * @param request
   * @return {Promise<OrangeDragonflyResponse>}
   */
  async processRequest (request) {
    const response = new OrangeDragonflyResponse()
    const route = this._router.route(request.path, request.method)
    const controller = new route.route_object.Controller(this, request, response)
    await controller.run(route.route_object.action, route.params, route.route_object.path)
    this.accessLog(request, response)
    return response
  }

  /**
   *
   * @param {array} args
   * @return {Promise<void>}
   */
  async processCommand (args) {
    const fArgs = args.slice(2)
    const name = fArgs.shift()
    if (!name) {
      throw new Error('Command name is not provided')
    }
    if (!this._registeredCommands[name]) {
      throw new Error('Command not found')
    }
    await this.init()
    await this._registeredCommands[name].run(null, this)
    await this.unload()
  }

  /**
   * Create tables for available models. Not recommended for production use.
   * @return {Promise<Array>}
   */
  async createModelTables (auto_indexes = false) {
    const Converter = OrangeDragonflyORMModelToSQL.getConverter(this.dbDriver)
    const c = new Converter(false, false, auto_indexes)
    const queries = c.convert(this.models)
    for (const q of queries) {
      await AbstractQuery.runRawSQL(q, {})
    }
    return queries
  }

  /**
   * Drops tables for available models. Extremely dangerous for production use.
   * @return {Promise<Array>}
   */
  async dropModelTables () {
    const Converter = OrangeDragonflyORMModelToSQL.getConverter(this.dbDriver)
    const c = new Converter()
    const queries = c.drop(this.models)
    for (const q of queries) {
      await AbstractQuery.runRawSQL(q, {})
    }
    return queries
  }
}

module.exports = OrangeDragonflyApp
