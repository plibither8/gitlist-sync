require('dotenv').config()
const polka = require('polka')

polka()
  .use((req, res, next) => {
    console.log(req.url)
    res.end(JSON.stringify(req.url))
  })
  .listen(process.env.HOOKS_PORT)
