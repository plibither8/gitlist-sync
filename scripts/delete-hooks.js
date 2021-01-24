const fetch = require('node-fetch')
const { ghAuthHeaders, getPublicRepos } = require('../utils')

async function main() {
  const repos = await getPublicRepos()
  let count = 0
  for (const repo of repos) {
    const hooks = await fetch(repo.hookUrl, { headers: ghAuthHeaders })
      .then(res => res.json())
    const id = hooks.find(({ config }) => config.url === 'https://git.mihir.ch/webhook/push')?.id
    if (id) {
      console.log(`[${++count}/${repos.length}] Deleting hook for ${repo.name}`)
      await fetch(repo.hookUrl + '/' + id, {
        method: 'DELETE',
        headers: ghAuthHeaders
      })
    }
  }
}

main()
