import http from 'http'
import fs from 'fs'
import url from 'url'
import util from 'util'

import uws from 'uws'
import chokidar from 'chokidar'

const { promisify } = util
const readFile = promisify(fs.readFile)
const { Server: WSS } = uws

const wsConnections = []
const wss = new WSS(({ noServer: true }))

chokidar.watch('./assets', {depth: 99}).on('all', _ => wsConnections.forEach(ws => ws.send('update')))

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url, true)
  try {
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'})
    res.end(await readFile(`./assets${pathname}`))
  } catch (err) {
    res.writeHead(404, {'Access-Control-Allow-Origin': '*'})
    res.end()
  }
})

server.on('upgrade', (request, socket, head) => wss.handleUpgrade(request, socket, head, ws => {
  wsConnections.push(ws)
  ws.on('close', _ => wsConnections.splice(wsConnections.indexOf(ws), 1))
}))
server.listen(30800)