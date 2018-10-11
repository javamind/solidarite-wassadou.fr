const express = require('express');
const http = require('http');
const compression = require('compression');
const helmet = require('helmet');
const cachePolicy = require('./server/app.webcache');
const security = require('./server/app.security');
const session = require('express-session');

const SOLIDARITE_WASSADOU = {
  static: 'build/dist',
  port: process.env.PORT || 8082,
  secret: process.env.SPW_SESSION_SECRET || 'SMHQs7cLAC3x',
  http2: process.env.DEVMIND_HTTP2,
};

const app = express()
  .enable('trust proxy')
  .use(security.rewrite())
  .use(session(security.sessionAttributes(SOLIDARITE_WASSADOU.secret)))
  .use(compression())
  .use(express.urlencoded({extended: false}))
  .use(helmet())
  .use(helmet.contentSecurityPolicy(security.securityPolicy()))
  .use(security.corsPolicy())
  .use(express.static(SOLIDARITE_WASSADOU.static, {setHeaders: cachePolicy.setCustomCacheControl}))
  .all('*', security.notFoundHandler());

app.set('port', SOLIDARITE_WASSADOU.port);

http.Server(app)
    .listen(SOLIDARITE_WASSADOU.port)
    .on('error', onError)
    .on('listening', () => {
      console.debug('Listening on ' + SOLIDARITE_WASSADOU.port);
      console.debug(`Environnement ${process.env.NODE_ENV}`);
    });

function onError(error) {
  console.error(error);
  if (error.syscall !== 'listen') {
    throw error;
  }
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EADDRINUSE':
      console.error('Port is already in use : ' + SOLIDARITE_WASSADOU.port);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

