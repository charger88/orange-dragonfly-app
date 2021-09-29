/**
 * Middleware is piece of logic which can be executed before of after controller's action - it modifies request, response or controller object itself
 * @abstract
 */
class OrangeDragonflyMiddleware {
  /**
   *
   * @param {OrangeDragonflyController} controller
   */
  constructor (controller) {
    this.controller = controller
  }

  /**
   * Abstract method with middleware logic
   * @abstract
   * @param {Object} params
   * @return {Promise<boolean>} Return false if request's execution should be terminated (current response will be sent to output)
   */
  async run (params) {
    return true
  }
}

module.exports = OrangeDragonflyMiddleware
