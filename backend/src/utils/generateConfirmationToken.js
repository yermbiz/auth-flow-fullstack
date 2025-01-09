const crypto = require('crypto');

function generateConfirmationToken() {
  return {
    token: crypto.randomBytes(16).toString('hex'),
    tokenExpiration: new Date(Date.now() + 3600 * 1000)

  }
}

module.exports = generateConfirmationToken

