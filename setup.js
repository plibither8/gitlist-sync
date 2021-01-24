require('dotenv').config()
const path = require('path')
const { writeFile } = require('fs/promises')
const fetch = require('node-fetch')
const git = require('simple-git')()
const config = require('./config.json')

const GH_API_BASE = 'https://api.github.com'

const ghAuthHeaders = {
  Authorization: `token ${process.env.GH_TOKEN}`
}

async function getPublicRepos() {
  const searchParams = new URLSearchParams()
  searchParams.set('visibility', 'public')
  searchParams.set('affiliation', 'owner')
  searchParams.set('per_page', 100)
  const response = await fetch(`${GH_API_BASE}/user/repos?${searchParams}`, {
    method: 'GET',
    headers: ghAuthHeaders
  })
  const json = await response.json()
  return json
}

async function filterAndProcessRepos(repos) {
  return repos
    .filter(repo => !repo.fork)
    .map(({ name, description, ssh_url, hooks_url }) => ({
      name,
      description,
      hookUrl: hooks_url,
      cloneUrl: ssh_url
    }))
}

async function cloneToPath(repo) {
  const { username, repositoriesPath } = config
  const remotePath = repo.cloneUrl
  const localPath = path.join(repositoriesPath, username, repo.name)
  await git.clone(remotePath, localPath)
  return localPath
}

async function updateDescription(localPath, description) {
  const descriptionFilePath = `${localPath}/.git/description`
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
  console.log('Getting repos...')
  let progressCount = 0
  let totalProgressRequired
  await getPublicRepos()
    .then(filterAndProcessRepos)
    .then(repos => {
      totalProgressRequired = repos.length * 4
      return repos
    })
    .then(repos => repos.map(async repo => {
      const progress = () => `[${++progressCount} / ${totalProgressRequired}]`

      console.log(`${progress()} cloning ${repo.name}...`)
      const localPath = await cloneToPath(repo)

      console.log(`${progress()} adding description for ${repo.name}...`)
      await updateDescription(localPath, repo.description)

      console.log(`${progress()} creating webhook for ${repo.name}...`)
      await createWebhook(repo.hookUrl)

      console.log(`${progress()} done ${repo.name}`)
    }))
}

main()
