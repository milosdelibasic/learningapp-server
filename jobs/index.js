/**
 * Created by laslo on 5/26/20.
 */

const cron = require('./cron')

const _start = async () => {
  await cron.start()
}

module.exports =  {
  start: _start
}