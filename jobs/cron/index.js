/**
 * Created by laslo on 5/26/20.
 * Cron Job for executing scheduled tasks
 */

const schedule = require('node-schedule')
const path = require('path');
const logger = require('../../lib/logger');
const mainHandler = require('../../database/main.handler')

const _runJob = (jobPath, method, params) => {
  try {
    logger.system('info', `Starting cron job at path ${jobPath}, method ${method} with params ${params}`)
    const job = require(jobPath)
    job[method](params)
  } catch (err) {
    logger.system('error', `Error initializing job ar path ${jobPath} with params ${params} `, err)
  }
}

module.exports.start = async () => {
  logger.system('info', `Initializing cron jobs`)
  const jobs = await mainHandler.findAll(null, 'config', { type: 'cron' })
  logger.system('info', `Found ${jobs.length} cron jobs`)
  if (jobs.length > 0) {
    jobs.forEach(job => {
      const cronJobPath = path.join(__dirname, '../..', job.path)
      logger.system('info', `Seting up cron job at path ${cronJobPath}, method ${job.method} with params ${job.params} at interval ${job.interval}`)
      schedule.scheduleJob(job.interval, () => {
        _runJob(cronJobPath, job.method, job.params)
      })
    })
  }
}