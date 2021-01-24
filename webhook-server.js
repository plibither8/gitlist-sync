require('dotenv').config()
const polka = require('polka')
const { json } = require('body-parser')
const config = require('./config.json')
const git = require('simple-git')()

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
  .post('/webhook/push', handlers.push)
  .post('/webhook/repo', handlers.repo)
  .listen(config.webhookPort)

console.log('server listening at http://localhost:%d', config.webhookPort)
