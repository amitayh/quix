import {spawn} from 'child_process';
import * as path from 'path';
import axios from 'axios';

const retry = (what: () => PromiseLike<any>, interval = 500, howManyTimes = 20) => {
  let counter = 0;
  let lastError;

  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      if (counter++ === howManyTimes) {
        clearInterval(timer);
        reject(lastError);
      } else {
        what().then(() => {
          clearInterval(timer);
          resolve();
        }, (e => lastError = e));
      }
    }, interval);
  })
}

export const startServer = async (port = 3300) => {
  const env = {
    ...process.env,
    DB_TYPE: 'sqlite',
    AUTH_TYPE: 'fake',
    DB_AUTO_MIGRATE: 'true',
    REMOTE_STATICS_PATH: 'http://localhost:3200/',
    LOCAL_STATICS_PATH: path.resolve(__dirname, '..', 'src'),
    HTTP_PORT: port
  }
  const serviceFolder = path.resolve('..', 'service');
  let isAlive = true;
  const child = spawn('node', [serviceFolder], {env, cwd: serviceFolder, stdio: 'inherit'});
  child.on('error', err => {
    console.error('error on server');
    console.error(err);
  });

  child.on('exit', () => {
    isAlive = false;
  });

  function stop() {
    if (isAlive) {
      child.kill();
    }
  }
  await retry(() => axios.get(`http://localhost:${port}/health/is_alive`));
  return stop;
}

