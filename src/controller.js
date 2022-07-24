const { camelCaseToDashCase } = require('./helpers')
const validate = require('orange-dragonfly-validator')

/**
 * Orange Dragonfly Web abstract controller
 * @abstract
 */
class OrangeDragonflyController {
  /**
   *
   * @param {OrangeDragonflyApp} app
   * @param {OrangeDragonflyRequest} request
   * @param {OrangeDragonflyResponse} response
   */
  constructor (app, request, response) {
    this.app = app
    this.request = request
    this.response = response
    this._variables = {}
  }

  /**
   * Processes request
   * @param {string} action
   * @param {object} params
   * @param {object} route
   * @return {Promise<void>}
   */
  async run (action, params, routePath) {
    try {
      if (this.app.cors) {
        this.response.addHeader('Access-Control-Allow-Origin', (this.app.cors === true || !this.app.cors.allow_origin) ? '*' : this.app.cors.allow_origin)
        this.response.addHeader('Access-Control-Allow-Headers', (this.app.cors === true || !this.app.cors.allow_headers) ? '*' : this.app.cors.allow_headers)
        if (this.app.cors !== true && this.app.cors.expose_headers) {
          this.response.addHeader('Access-Control-Expose-Headers', this.app.cors.expose_headers)
        }
        this.response.addHeader('Access-Control-Allow-Methods', this.app.optionPaths[routePath] ? this.app.optionPaths[routePath].map(v => v.toUpperCase()).join(', ') : '')
      }
      if (['genericOptionsAction'].includes(action)) {
        await this._run(action, params, routePath)
      } else {
        if (await this.runMiddlewares(this.beforewares, params, routePath)) {
          if (await this._processValidation(action)) {
            if (await this.runBeforeRequest(params, action, routePath)) {
              await this._run(action, params, routePath)
              if (await this.runAfterRequest(params, action, routePath)) {
                await this.runMiddlewares(this.afterwares, params, routePath)
              }
            }
          }
        }
      }
    } catch (e) {
      await this.handleError(e)
    }
  }

  /**
   * Processes request itself (without middlewares)
   * @param {string} action
   * @param {object} params
   * @param {object} route
   * @return {Promise<void>}
   */
  async _run (action, params, routePath) {
    const content = await this[action](params, routePath)
    if (typeof content !== 'undefined') {
      this.response.content = content
    }
  }

  /**
   * Exceptions handler
   * @param e
   * @return {Promise<void>}
   */
  async handleError (e) {
    try {
      this.processPotentialValidationException(e)
    } catch (_) {
      console.error(e)
      this.response.setError(500, 'Internal server error')
    }
  }

  /**
   * Path for the controller. By default it is being generated based on controller's name (dashed instead of camel-case).
   * For controller named "Index" path will be returned as root ("/")
   * "Controller" part from the end of the name will be ignored.
   * @return {string}
   */
  static get path () {
    let name = this.name
    if (name.endsWith('Controller')) {
      name = name.slice(0, -10)
    }
    if (name === 'Index') {
      return '/'
    }
    return '/' + camelCaseToDashCase(name)
  }

  /**
   * Name of the "id" parameter
   * @return {string}
   */
  static get idParameterName () {
    return '#id'
  }

  /**
   * List of middlewares to be executed before controller's action (like doGetId)
   * @return {string[]}
   */
  get beforewares () {
    return []
  }

  /**
   * List of middlewares to be executed after controller's action (like doGetId)
   * @return {string[]}
   */
  get afterwares () {
    return []
  }

  /**
   *
   * @param {string[]} middlewares
   * @param {object} params
   * @param {string} routePath
   * @return {Promise<boolean>}
   */
  async runMiddlewares (middlewares, params, routePath) {
    for (const middlewareClassName of middlewares) {
      const Middleware = this.app.getMiddleware(middlewareClassName)
      const mw = new Middleware(this)
      if (!await mw.run(params, routePath)) {
        return false
      }
    }
    return true
  }

  /**
   * Custom code to be invoked before controller's action
   * @param {object} params
   * @param {string} action
   * @param {string} routePath
   * @return {Promise<boolean>}
   */
  async runBeforeRequest (params, action, routePath) {
    return true
  }

  /**
   * Custom code to be invoked after controller's action
   * @param {object} params
   * @param {string} action
   * @param {string} routePath
   * @return {Promise<boolean>}
   */
  async runAfterRequest (params, action, routePath) {
    return true
  }

  /**
   * Converts input into HTML page. Very primitive functionality, if you need to generate real web pages, override this function with call of some 3rd party library
   * @param {string|object} content
   * @return {string}
   */
  render (content) {
    return `<html><body>${content}</body></html>`
  }

  /**
   * Returns controller's routes
   * @return {{method: {string}, path: {string}, action: {string}}[]}
   */
  static get routes () {
    let actions = []
    let obj = new this()
    do {
      actions.push(...Object.getOwnPropertyNames(obj))
      obj = Object.getPrototypeOf(obj)
    } while (obj)
    const methodPattern = /^do(Get|Head|Post|Patch|Put|Delete|Options)(Id)?([a-zA-z0-9]+)?$/
    actions = actions
      .filter(item => methodPattern.test(item))
      .filter(item => typeof this.prototype[item] === 'function')
      .sort()
    const routes = []
    for (const action of actions) {
      const m = action.match(methodPattern)
      if (m) {
        const method = m[1].toLowerCase()
        let path = this.path
        if (m[2] === 'Id') path += `${path !== '/' ? '/' : ''}{${this.idParameterName}}`
        if (m[3]) path += `${path !== '/' ? '/' : ''}${camelCaseToDashCase(m[3])}`
        routes.push({ method, path, action })
      }
    }
    if (!routes.length) {
      console.warn(`There is no routes found in controller ${this.name}`)
    }
    return routes
  }

  /**
   * Default handler for OPTIONS requests
   *
   * @param _
   * @param {string} routePath
   */
  async genericOptionsAction (_, routePath) {
    this.response.code = 204
    this.response.addHeader('Allow', this.app.optionPaths[routePath] ? this.app.optionPaths[routePath].map(v => v.toUpperCase()).join(', ') : '')
  }

  /**
   * Tries to run validation
   * @param {string} action Name of the action
   * @returns {Promise<boolean>}
   */
  async _processValidation (action) {
    const validationAction = `validate${action.slice(2)}`
    if (this[validationAction]) {
      const [querySchema, bodySchema] = await this[validationAction]()
      try {
        if (querySchema) {
          validate(querySchema, this.request.query)
        }
        if (bodySchema) {
          validate(bodySchema, this.request.body)
        }
      } catch (e) {
        this.processPotentialValidationException(e)
        return false
      }
    }
    return true
  }

  /**
   * Tries to handle validation exception
   * @param {Error} e Exception
   * @param {number} error_code HTTP code to return if error is ValidationException
   * @param {string} error_message Error message to return if error is ValidationException
   * @param {?string} details Shows if validation details should be returned and what should be the name of the parameter containing them
   */
  processPotentialValidationException (e, error_code = 422, error_message = 'Validation error', details = 'details') {
    if (e.constructor.name === 'ValidationException') {
      this.response.setError(error_code, error_message, details ? { [details]: e.info } : null)
    } else {
      throw e
    }
  }

  /**
   * Sets controller's variable
   * @param {string} key Variable name
   * @param {*} value Variable value
   */
  setVar (key, value) {
    this._variables[key] = value
  }

  /**
   * Gets controller's variable
   * @param {string} key Variable name
   * @throws {Error} If variable not found
   * @returns {*} Variable value
   */
  getVar (key) {
    if (!(key in this._variables)) {
      throw new Error(`Controller variable "${key}" is not defined`)
    }
    return this._variables[key]
  }
}

module.exports = OrangeDragonflyController
