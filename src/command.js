const { camelCaseToDashCase } = require('./helpers')
const { OrangeCommand } = require('orange-command')

/**
 * Orange Dragonfly console command
 * @abstract
 */
class OrangeDragonflyCommand extends OrangeCommand {
  /**
   * Command logic
   * @abstract
   * @return {Promise<void>}
   */
  async action () {
    throw new Error(`${this.constructor.name}.run should be overridden`)
  }

  /**
   * Runs the command
   * @param {object?} params Invocation parameters (command line arguments will be used by default)
   * @param {OrangeDragonflyApp} app Application
   * @returns {Promise<OrangeCommand>}
   */
  static async run (params = null, app = null) {
    const commandParams = params || this.commandLineArguments
    const command = new this(commandParams)
    command.app = app
    return await command._runAction()
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

  /**
   *
   * @return {OrangeDragonflyApp}
   */
  get app () {
    if (!this._app) throw new Error('App is not defined')
    return this._app
  }

  /**
   *
   * @param {OrangeDragonflyApp} app
   */
  set app (app) {
    this._app = app
  }
}

module.exports = OrangeDragonflyCommand
