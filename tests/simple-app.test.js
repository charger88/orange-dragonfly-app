/* eslint-disable no-undef */

const { OrangeDragonflyRequest } = require('orange-dragonfly-web-server')
const SimpleApp = require('./../example/simple-app.js')
SimpleApp.prototype.accessLog = function () {}
const sa = new SimpleApp({})

test('root', async () => {
  const request = new OrangeDragonflyRequest('GET', '/', {}, '')
  const response = await sa.processRequest(request)
  expect(response.code).toBe(200)
  expect(response.content).toBe('Hello world')
  expect(response.contentType).toBe('text/plain')
})

test('product item html', async () => {
  const request = new OrangeDragonflyRequest('GET', '/products/123', { 'user-agent': 'cURL/1.0.0' }, '')
  const response = await sa.processRequest(request)
  expect(response.code).toBe(200)
  expect(response.content).toBe('<html><body><h1><a href="/products">Products</a> &rarr; Product</h1><p>ID: 123</p></body></html>')
  expect(response.contentType).toBe('text/html')
})

test('block search middleware', async () => {
  const request = new OrangeDragonflyRequest('GET', '/products/123', { 'user-agent': 'GoogleBot/1.0.0' }, '')
  const response = await sa.processRequest(request)
  expect(response.code).toBe(401)
  expect(response.content).toEqual({ error: 'No, Google, you are not allowed here' })
  expect(response.contentType).toBe('application/json')
})
