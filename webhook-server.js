require('dotenv').config()
const crypto = require('crypto')
const polka = require('polka')
const { json } = require('body-parser')
const config = require('./config.json')
const git = require('simple-git')()

function createComparisonSignature (body = '') {
  const hmac = crypto.createHmac('sha1', process.env.WEBHOOK_SECRET)
  const signature = hmac.update(JSON.stringify(body)).digest('hex')
  return `sha1=${signature}`
}

function compareSignatures (receivedSignature = '', selfSignature) {
  const source = Buffer.from(receivedSignature)
  const comparison = Buffer.from(selfSignature)
  return receivedSignature.length === selfSignature.length &&
    crypto.timingSafeEqual(source, comparison)
}

function verifyPayload (req, res, next) {
  const { headers, body } = req
  const receivedSignature = headers['x-hub-signature']
  const selfSignature = createComparisonSignature(body)
  if (!compareSignatures(receivedSignature, selfSignature)) {
    return res.writeHead(401).end('Signature mismatch!')
  }
  next()
}

async function pull(repo) {
  const localPath = `${config.repositoriesPath}/${repo}`
  await git.cwd(localPath).pull('origin', 'master')
}

const handlers = {
  push: async (req, res) => {
    const { repository } = req.body
    pull(repository.full_name)
    res.end('success!')
  },

  repo: async (req, res) => {
    // const {  }
  }
}

polka()
  .use(json())
  .use(verifyPayload)
  .post('/webhook/push', handlers.push)
  .post('/webhook/repo', handlers.repo)
  .listen(config.webhookPort)

console.log('server listening at http://localhost:%d', config.webhookPort)
