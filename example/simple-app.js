const { OrangeDragonflyApp, OrangeDragonflyController, OrangeDragonflyMiddleware, OrangeDragonflyCommand } = require('./../index.js')

class IndexController extends OrangeDragonflyController {
  async doGet () {
    return 'Hello world'
  }

  async doGetItWorks () {
    this.response.code = 201
    this.response.content = 'It works'
  }

  async doGetRedirect () {
    this.response.code = 302
    this.response.addHeader('Location', 'https://www.michaelkelner.com')
  }

  async doGetJson () {
    return { timestamp: Date.now() }
  }
}

class ProductsController extends OrangeDragonflyController {
  get beforewares () {
    return ['BlockBotsMiddleware']
  }

  async doGet () {
    return this.render('<h1>Products</h1><ul><li><a href="/products/100">Hundred</a></li><li><a href="/products/1000">Thousand</a></li></ul>')
  }

  async doGetId (params) {
    return this.render(`<h1><a href="/products">Products</a> &rarr; Product</h1><p>ID: ${params.id}</p>`)
  }
}

class BlockBotsMiddleware extends OrangeDragonflyMiddleware {
  /**
   * @param {Object} params
   * @return {Promise<boolean>}
   */
  async run (params) {
    if (this.controller.request.getHeader('user-agent', '').includes('GoogleBot')) {
      this.controller.response.setError(401, 'No, Google, you are not allowed here')
      return false
    }
    return true
  }
}

class RandomCommand extends OrangeDragonflyCommand {
  async action () {
    this.c.line(Math.random() * (this.params['--max'] ? parseInt(this.params['--max'], 10) : 1))
  }
}

class SimpleApp extends OrangeDragonflyApp {
  accessLog (request, response) {
    console.debug((new Date()).toISOString(), request.method, request.path, response.code)
  }

  get models () {
    return []
  }

  get middlewares () {
    return [
      BlockBotsMiddleware
    ]
  }

  get controllers () {
    return [
      IndexController,
      ProductsController
    ]
  }

  get commands () {
    return [
      RandomCommand
    ]
  }
}

module.exports = SimpleApp
