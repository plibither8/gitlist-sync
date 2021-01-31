# gitlist-sync

> 🔄 Setup and sync mirrors of GitHub repositories to local machine

This repo contains the scripts and webhook handling server for the setup and syncing of the mirrors of my public GitHub repositories (owned by me, no forks).

[My mirrors: **https://git.mihir.ch**](https://git.mihir.ch).

## Configuration

### [config.json](/config.example.js)

1. Create config.json file from config.example.json: `cp config.example.json config.json`

* `repositoriesPath` is the local path where your git repos are going to be stored.
* `webhookBase` is the base url to which the webhook will be attached.
* `githubRepoListParams` won't really need much modification, unless you really want to. [Read this](https://docs.github.com/en/rest/reference/repos#list-repositories-for-the-authenticated-user).

### [.env](/.env.example)

1. Create .env file from .env.example: `cp .env.example .env`

2. Add the required variables. Note: the GitHub token will require the `repo` and `admin:repo_hook` scopes.

## Instructions

This project uses Node. Install dependencies: `npm install`.

### Setup

Run: `node scripts/setup`

Setting up is handled by the [setup.js](/scripts/setup.js) file:

The script:

* Clones all of my public repositories;
* Adds, for each cloned repo, the GitHub desciption to the `.git/description` file;
* Creates, for each cloned repo, a webhook for the `push` event that triggers a git pull on the respective repo.

### Webhook Server

Run: `node webhook-server`

Triggers a `git pull` on the repo that got pushed to, retrieved from the webhook payload. Read about [GitHub webhooks here](https://docs.github.com/en/developers/webhooks-and-events/about-webhooks).

The webhook is protected with secret, specified when programmatically creating the webhook in the Setup step. Signature verification ensures request integrity.

**Suggestion:** use [pm2](https://github.com/Unitech/pm2) or equivalent to daemonize the server.

### Sync

Run: `node scripts/sync`

Syncing is handled by the [sync.js](/scripts/sync.js).

It checks the updated repo list against the `repositories.json` file and performs clones for new repositories and deletions for deleted repos. Webhooks are not deleted.

**Suggestion:** this is a one-time script, without a set interval. I suggest setting up a cron for this script. I have it as `0 0 * * *` (daily).

## License

[MIT](LICENSE)
