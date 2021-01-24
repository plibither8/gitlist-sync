require('dotenv').config()
const { mkdir } = require('fs/promises')
const config = require('../config.json')
const {
  getPublicRepos,
  createMetaList,
  cloneToPath,
  updateDescription,
  createWebhook
} = require('../utils')

async function createRepositoriesPath () {
  console.log('[INFO]', 'Creating repositories\' directory if it does not exist')
  await mkdir(config.repositoriesPath, { recursive: true })
}

async function main () {
  // Create repositories path if it doesn't exist
  await createRepositoriesPath()

  // Track the progress of cloning
  let progressCount = 0
  let totalProgressRequired

  console.log('[INFO] Getting repos from GitHub')
  await getPublicRepos()
    .then(repos => {
      totalProgressRequired = repos.length * 4
      return repos
    })
    .then(createMetaList)
    .then(repos => repos.map(async repo => {
      const progress = () => `[${++progressCount}/${totalProgressRequired}]`

      console.log('[INFO] %s Cloning %s', progress(), repo.name)
      const localPath = await cloneToPath(repo)

      console.log('[INFO] %s Adding description for %s', progress(), repo.name)
      await updateDescription(localPath, repo)

      console.log('[INFO] %s Creating webhook for %s', progress(), repo.name)
      await createWebhook(repo)

      console.log('[INFO] %s Done %s', progress(), repo.name)
    }))
    .catch(err => {
      console.error('[ERR] An error occured:')
      console.error(err)
    })
}

main()
