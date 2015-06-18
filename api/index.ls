api-modules = <[./user ./article ./category]>

modules = 
  reqLoad: \./module/req_load
  regexs: \./module/regexs
  res: \./module/res

module.exports = (app, mariaPool) ->

  # import modules to express app
  app.mods = {}
  Object.keys(modules).forEach (key) ->
    app.mods[key] = require modules[key]

  apiModules.forEach (e) ->
    (require e) app, mariaPool