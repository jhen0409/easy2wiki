success = 100
fail = 200

module.exports.success = (res, data) ->
  res.json do
    status: success
    data: data

module.exports.fail = (res, data) ->
  res.json do
    status: fail
    data: data