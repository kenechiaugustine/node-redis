import express from 'express';
import redis from 'redis';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6569;

const client = redis.createClient(REDIS_PORT);

const app = express();

function cache(req, res, next) {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(`<h2>${username} has ${data} Github repos</h2>`);
    } else {
      next();
    }
  });
}

app.get('/repos/:username', cache, async (req, res) => {
  try {
    console.log('Fetching data...');

    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;

    // Set data to redis
    client.setEx(username, 3600, repos);

    res.send(`<h2>${username} has ${repos} Github repos</h2>`);
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

app.listen(PORT, () => {
  console.log(`App running on PORT: ${PORT}`);
});
