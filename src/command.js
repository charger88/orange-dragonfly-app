const { camelCaseToDashCase } = require('./helpers')

/**
 * Orange Dragonfly console command
 * @abstract
 */
class OrangeDragonflyCommand {
  /**
   *
   * @param {OrangeDragonflyApp} app
   */
  constructor (app) {
    this.app = app
  }

  /**
   * Command logic
   * @abstract
   * @param {object} params
   * @return {Promise<void>}
   */
  async run (params) {
    throw new Error(`${this.constructor.name}.run should be overridden`)
  }

  /**
   * Name of the command. By default it is being generated based on commands's name (dash-case instead of camel-case).
   * "Command" part from the end of the name will be ignored.
   * @return {string}
   */
  static get commandName () {
    let name = this.name
    if (name.endsWith('Command')) {
      name = name.slice(0, -7)
    }
    return camelCaseToDashCase(name)
  }
}

module.exports = OrangeDragonflyCommand
