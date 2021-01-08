const winston = require('winston');
const { Loggly } = require('winston-loggly-bulk');

const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    // TODO This won't work when deployed.
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new Loggly({
      token: '88f24aa4-ac69-4c38-8ee4-d9337087d826',
      subdomain: 'coachyard',
      tags: ['Winston-NodeJS'],
      json: true
    })
  ]
});

const log = ({ message, data = {}, context = {}, level = 'info' }) => {
  const {
    auth: {
      token: {
        uid,
        email,
        name
      } = {}
    } = {}
  } = context;

  const logObj = {
    message,
    data,
    user: {
      uid,
      email,
      name
    }
  };

  logger.log(level, logObj);
};

module.exports = { log };
