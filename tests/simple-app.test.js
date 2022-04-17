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

test('product item options', async () => {
  const request = new OrangeDragonflyRequest('OPTIONS', '/products/123', { 'user-agent': 'cURL/1.0.0' }, '')
  const response = await sa.processRequest(request)
  expect(response.code).toBe(204)
  expect(response.headers[0].name).toBe('Allow')
  expect(response.headers[0].value).toBe('GET')
})

test('block search middleware', async () => {
  const request = new OrangeDragonflyRequest('GET', '/products/123', { 'user-agent': 'GoogleBot/1.0.0' }, '')
  const response = await sa.processRequest(request)
  expect(response.code).toBe(401)
  expect(response.content).toEqual({ error: 'No, Google, you are not allowed here' })
  expect(response.contentType).toBe('application/json')
})

test('validation-passed', async () => {
  const request = new OrangeDragonflyRequest('POST', '/products', {}, JSON.stringify({ name: 'Bagel donut' }))
  const response = await sa.processRequest(request)
  expect(response.code).toBe(201)
  expect(response.content).toBe('Bagel donut is added')
})

test('validation-failed', async () => {
  const request = new OrangeDragonflyRequest('POST', '/products', {}, JSON.stringify({ name: '' }))
  const response = await sa.processRequest(request)
  expect(response.code).toBe(422)
  expect(response.contentType).toBe('application/json')
  expect(response.content.details.name[0]).toBe('Minimal value (length) is 1. 0 provided')
})
