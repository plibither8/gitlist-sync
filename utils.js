require('dotenv').config({ path: __dirname + '/.env' })
const { writeFile } = require('fs/promises')
const path = require('path')
const fetch = require('node-fetch')
const config = require('./config.json')
const git = require('simple-git')()

const GH_API_BASE = 'https://api.github.com'
const ghAuthHeaders = {
  Authorization: `token ${process.env.GH_TOKEN}`
}

function filterAndProcessRepos (repos) {
  return repos
    .filter(repo => !repo.fork)
    .map(({
      description,
      full_name: name,
      ssh_url: cloneUrl,
      hooks_url: hookUrl
    }) => ({ name, description, hookUrl, cloneUrl }))
}

function getPublicRepoParams () {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(config.githubRepoListParams)) {
    searchParams.set(key, value)
  }
  return searchParams
}

async function getPublicRepos () {
  const searchParams = getPublicRepoParams()
  const response = await fetch(`${GH_API_BASE}/user/repos?${searchParams}`, { headers: ghAuthHeaders })
  const json = await response.json()
  return filterAndProcessRepos(json)
}

async function createMetaList (repos) {
  console.log('[INFO]', 'Creating list of cloned directories')
  const list = JSON.stringify(repos.map(repo => repo.name))
  const filePath = path.join(config.repositoriesPath, 'repositories.json')
  await writeFile(filePath, list, 'utf-8')
  return repos
}

async function cloneToPath (repo, log = false) {
  if (log) console.log('[INFO] Cloning %s', repo.name)
  const remotePath = repo.cloneUrl
  const localPath = path.join(config.repositoriesPath, repo.name)
  await git.clone(remotePath, localPath)
  return localPath
}

async function updateDescription (localPath, repo, log = false) {
  if (log) console.log('[INFO] Adding description for %s', repo.name)
  const descriptionFilePath = path.join(localPath, '.git', 'description')
  await writeFile(descriptionFilePath, repo.description || '', 'utf-8')
}

async function createWebhook (repo, log = false) {
  if (log) console.log('[INFO] Creating webhook for %s', repo.name)
  const requestBody = {
    config: {
      url: config.webhookBase + '/push',
      content_type: 'json',
      secret: process.env.WEBHOOK_SECRET
    }
  }
  await fetch(repo.hookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...ghAuthHeaders
    },
    body: JSON.stringify(requestBody)
  })
}

module.exports = {
  ghAuthHeaders,
  getPublicRepos,
  createMetaList,
  cloneToPath,
  updateDescription,
  createWebhook
}
