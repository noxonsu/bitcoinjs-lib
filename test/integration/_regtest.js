var bitcoin = require('../../')
var dhttp = require('dhttp/200')
var parallel = require('run-parallel')

var APIPASS = process.env.APIPASS || 'satoshi'
var APIURL = 'https://api.dcousens.cloud/1'

function broadcast (txHex, callback) {
  dhttp({
    method: 'PUT',
    url: APIURL + '/t/push',
    body: txHex
  }, callback)
}

function mine (count, callback) {
  dhttp({
    method: 'POST',
    url: APIURL + '/r/generate?count=' + count + '&key=' + APIPASS
  }, callback)
}

function faucet (outputs, callback) {
  parallel(outputs.map(function (output) {
    return function (next) {
      dhttp({
        method: 'POST',
        url: APIURL + '/r/faucet?address=' + output.address + '&value=' + output.value + '&key=' + APIPASS
      }, next)
    }
  }), function (err) {
    if (err) return callback(err)

    parallel(outputs.map(function (output) {
      return function (next) {
        unspents(output.address, next)
      }
    }), function (err, tmp) {
      if (err) return callback(err)

      console.log(tmp)

      // flatten
      let results = []
      tmp.forEach(function (x) {
        results = results.concat(x)
      })

      callback(null, results)
    })
  })
}

function fetch (txId, callback) {
  dhttp({
    method: 'GET',
    url: APIURL + '/t/' + txId
  }, callback)
}

function unspents (address, callback) {
  dhttp({
    method: 'GET',
    url: APIURL + '/a/' + address + '/unspents'
  }, callback)
}

function verify (txo, callback) {
  let { txId } = txo

  fetch(txId, function (err, txHex) {
    if (err) return callback(err)

    // TODO: verify address and value
    callback()
  })
}

function randomAddress () {
  return bitcoin.ECPair.makeRandom().getAddress()
}

module.exports = {
  broadcast: broadcast,
  faucet: faucet,
  fetch: fetch,
  mine: mine,
  network: bitcoin.networks.testnet,
  unspents: unspents,
  verify: verify,
  randomAddress: randomAddress,
  RANDOM_ADDRESS: randomAddress()
}
