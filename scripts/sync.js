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

  console.log('[INFO] Fetching new list')
  const updatedRepos = await getPublicRepos()
  const updatedRepoNames = updatedRepos.map(repo => repo.name)

  const newRepos = updatedRepoNames
    .filter(updated => !currentRepoNames.includes(updated))
    .map(name => updatedRepos.find(repo => repo.name === name))
  const deletedRepos = currentRepoNames.filter(current => !updatedRepoNames.includes(current))

  const delta = {
    new: newRepos.length,
    deleted: deletedRepos.length
  }

  if (delta.new + delta.deleted === 0) {
    console.log('[INFO] No changes, exiting.')
    return
  }

  console.log('[Info] Delta:', delta)

  // rm deleted repos locally
  deletedRepos.map(async repo => {
    const path = path.join(config.repositoriesPath, repo)
    await rmdir(path, { recursive: true })
  })

  // clone new repos, setup description, add webhook
  newRepos.map(async repo => {
    const localPath = await cloneToPath(repo, true)
    await updateDescription(localPath, repo, true)
    await createWebhook(repo, true)
    console.log('[INFO] Done %s', repo.name)
  })

  // update meta list
  await createMetaList(updatedRepos)
}

main()
