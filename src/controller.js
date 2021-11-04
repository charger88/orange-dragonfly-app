const { camelCaseToDashCase } = require('./helpers')

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
  }

  /**
   * Processes request
   * @param {string} action
   * @param {object} params
   * @return {Promise<void>}
   */
  async run (action, params) {
    if (await this.runMiddlewares(this.beforewares, params)) {
      if (await this.runBeforeRequest(params)) {
        const content = await this[action](params)
        if (typeof content !== 'undefined') {
          this.response.content = content
        }
        if (await this.runAfterRequest(params)) {
          await this.runMiddlewares(this.afterwares, params)
        }
      }
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
   * @return {Promise<boolean>}
   */
  async runMiddlewares (middlewares, params) {
    for (const middlewareClassName of middlewares) {
      const Middleware = this.app.getMiddleware(middlewareClassName)
      const mw = new Middleware(this)
      if (!await mw.run(params)) {
        return false
      }
    }
    return true
  }

  /**
   * Custom code to be invoked before controller's action
   * @param {object} params
   * @return {Promise<boolean>}
   */
  async runBeforeRequest (params) {
    return true
  }

  /**
   * Custom code to be invoked after controller's action
   * @param {object} params
   * @return {Promise<boolean>}
   */
  async runAfterRequest (params) {
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
    let actions = [];
    let obj = new this();
    do {
      actions.push(...Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));
    actions = actions.sort().filter(item => typeof this.prototype[item] === 'function')
    const routes = []
    for (const action of actions) {
      const m = action.match(/^do(Get|Head|Post|Patch|Put|Delete|Options)(Id)?([a-zA-z0-9]+)?$/)
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
}

module.exports = OrangeDragonflyController
