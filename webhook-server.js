require('dotenv').config()
const polka = require('polka')
const { json } = require('body-parser')
const config = require('./config.json')
const git = require('simple-git')()

async function pull(repo) {
  const localPath = `${config.repositoriesPath}/${repoPath}`
  await git.cwd(localPath).pull('origin', 'master')
}

polka()
  .use(json())
  .post('/webhook/push', async (req, res) => {
    const { repository } = req.body
    pull(repository.full_name)
  })
  .listen(process.env.HOOKS_PORT)
