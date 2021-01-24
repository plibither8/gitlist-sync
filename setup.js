require('dotenv').config()
const path = require('path')
const { writeFile, mkdir } = require('fs/promises')
const fetch = require('node-fetch')
const git = require('simple-git')()
const config = require('./config.json')

const GH_API_BASE = 'https://api.github.com'

const ghAuthHeaders = {
  Authorization: `token ${process.env.GH_TOKEN}`
}

async function createRepositoriesPath() {
  console.log('[INFO]', 'Creating repositories\' directory if it does not exist')
  await mkdir(config.repositoriesPath, { recursive: true })
}

async function getPublicRepos() {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(config.githubRepoListParams)) {
    searchParams.set(key, value)
  }
  const response = await fetch(`${GH_API_BASE}/user/repos?${searchParams}`, { headers: ghAuthHeaders })
  const json = await response.json()
  return json
}

function filterAndProcessRepos(repos) {
  return repos
    .filter(repo => !repo.fork)
    .map(({ full_name, description, ssh_url, hooks_url }) => ({
      name: full_name,
      description,
      hookUrl: hooks_url,
      cloneUrl: ssh_url
    }))
}

async function createMetaList(repos) {
  console.log('[INFO]', 'Creating list of cloned directories')
  const list = JSON.stringify(repos.map(repo => repo.name))
  const filePath = path.join(config.repositoriesPath, 'repositories.json')
  await writeFile(filePath, list, 'utf-8')
  return repos
}

async function cloneToPath(repo) {
  const remotePath = repo.cloneUrl
  const localPath = path.join(config.repositoriesPath, repo.name)
  await git.clone(remotePath, localPath)
  return localPath
}

async function updateDescription(localPath, description) {
  const descriptionFilePath = path.join(localPath, '.git', 'description')
  await writeFile(descriptionFilePath, description || '', 'utf-8')
}

async function createWebhook(webhookUrl) {
  const requestBody = {
    config: {
      url: config.webhookBase + '/push',
      content_type: 'json'
    }
  }
  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...ghAuthHeaders
    },
    body: JSON.stringify(requestBody)
  })
}

async function main () {
  // Create repositories path if it doesn't exist
  await createRepositoriesPath()

  // Track the progress of cloning
  let progressCount = 0
  let totalProgressRequired

  console.log('[INFO] Getting repos from GitHub')
  await getPublicRepos()
    .then(filterAndProcessRepos)
    .then(repos => {
      totalProgressRequired = repos.length * 4
      return repos
    })
    .then(createMetaList)
    .then(repos => repos.map(async repo => {
      const progress = () => `[${++progressCount}/${totalProgressRequired}]`

      console.log(`[INFO] %s Cloning %s`, progress(), repo.name)
      const localPath = await cloneToPath(repo)

      console.log(`[INFO] %s Adding description for %s`, progress(), repo.name)
      await updateDescription(localPath, repo.description)

      console.log(`[INFO] %s Creating webhook for %s`, progress(), repo.name)
      await createWebhook(repo.hookUrl)

      console.log(`[INFO] %s Done %s`, progress(), repo.name)
    }))
    .catch(err => {
      console.error('[ERR] An error occured:')
      console.error(err)
    })
}

main()
