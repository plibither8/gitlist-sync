const fetch = require('node-fetch')
const { ghAuthHeaders, getPublicRepos } = require('../utils')

async function main() {
  const hookUrl = 'https://git.mihir.ch/webhook/push'
  const repos = await getPublicRepos()
  let count = 0
  for (const repo of repos) {
    const hooks = await fetch(repo.hookUrl, { headers: ghAuthHeaders }).then(res => res.json())
    const hook = hooks.find(({ config }) => config.url === hookUrl)
    if (hook?.id) {
      console.log(`[${++count}/${repos.length}] Deleting hook for ${repo.name}`)
      await fetch(repo.hookUrl + '/' + hook.id, {
        method: 'DELETE',
        headers: ghAuthHeaders
      })
    }
  }
}

main()
