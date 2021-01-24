const path = require('path')
const { rmdir } = require('fs/promises')
const config = require('../config.json')
const {
  getPublicRepos,
  cloneToPath,
  updateDescription,
  createWebhook,
  createMetaList
} = require('../utils')

async function main () {
  const currentRepoNames = require(`${config.repositoriesPath}/repositories.json`)
  const updatedRepos = await getPublicRepos()
  const updatedRepoNames = updatedRepos.map(repo => repo.name)

  const newRepos = updatedRepoNames
    .filter(updated => !currentRepoNames.contains(updated))
    .map(name => updatedRepos.find(repo => repo.name === name))
  const deletedRepos = currentRepoNames.filter(current => !updatedRepoNames.contains(current))

  // rm deleted repos locally
  deletedRepos.map(async repo => {
    const path = path.join(config.repositoriesPath, repo)
    await rmdir(path, { recursive: true })
  })

  // clone new repos, setup description, add webhook
  newRepos.map(async repo => {
    console.log('[INFO] Cloning %s', repo.name)
    const localPath = await cloneToPath(repo)

    console.log('[INFO] Adding description for %s', repo.name)
    await updateDescription(localPath, repo)

    console.log('[INFO] Creating webhook for %s', repo.name)
    await createWebhook(repo)

    console.log('[INFO] Done %s', repo.name)
  })

  // update meta list
  await createMetaList(updatedRepos)
}

main()
