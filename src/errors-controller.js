const OrangeDragonflyController = require('./controller')

/**
 * Special controller which is being used in some error scenarios
 * @abstract
 */
class OrangeDragonflyErrorsController extends OrangeDragonflyController {
  /**
   * Default error for "Not found" error
   */
  e404 () {
    this.response.setError(404, 'Not found')
  }
}

module.exports = OrangeDragonflyErrorsController
