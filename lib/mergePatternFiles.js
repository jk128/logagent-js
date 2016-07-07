'use strict'
var merge = require('merge')
var yaml = require('js-yaml')
var logger = require('./logger')
var fs = require('fs')
var cfgFiles = null

function mergeConfigs (cfgs) {
  var conf = cfgs[0]
  if (!conf.patterns) {
    logger.error('missing patterns section in config ' + conf._fileName)
    conf.patterns = []
  }
  for (var config in cfgs) {
    var tmp = merge.recursive(false, conf, cfgs[config])
    if (!tmp.patterns) {
      logger.error('missing patterns section in config ' + tmp._fileName)
      tmp.patterns = []
    }
    tmp.patterns = cfgs[config].patterns.concat(conf.patterns)  
    conf = tmp
  }
  return conf
}

function notifyFileChange (event, file) {
  if (event === 'change') {
    this.cb(file)
  }
}

function watchConfigs (files, notifyCallback) {
  files.forEach(function (f) {
    fs.watch(f, {persistent: false, recursive: false}, notifyFileChange.bind({cb: notifyCallback, file: f}))
  })
}
function loadConfigFiles (files, notifyCallback) {
  var configs = files.map(function (file) {
    logger.debug('merge pattern file ' + file)
    var cfg = {}
    try {
      cfg = yaml.load(fs.readFileSync(file, 'utf8'))
      cfg._fileName=file
    } catch (e) {
      logger.error('ignoring pattern file ' + file + ' ' + e)
      if (e.reason && e.mark) {
        logger.error('Error parsing file: ' + file + ' ' + e.reason + ' line:' + e.mark.line + ' column:' + e.mark.columns)
      } else {
        // console.log(error.stack)
        logger.error('Error parsing file: ' + file + ' ' + e + ' ' + e.stack)
      }
    } finally {
      // console.log(config)
      return cfg
    }
  })
  if (notifyCallback && cfgFiles === null) {
    try {
      cfgFiles = files

      watchConfigs(cfgFiles, notifyCallback)
    } catch (err) {
      logger.error('error watching pattern file:' + err)
    }
  }
  return mergeConfigs(configs)
}

// console.log(loadConfigFiles(['./patterns.yml']))
// module.exports.mergeConfigs = mergeConfigs
module.exports = loadConfigFiles