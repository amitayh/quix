import {startServer} from '../real-server';
import {Driver} from './driver';

describe.only('',function () {
  this.timeout(3000000);
  let stop;
  let driver: Driver;

  beforeEach(async () => {
    stop = await startServer(4000);
  });

  afterEach(() => {
    stop();
  })
  

  beforeEach(async () => {
    driver = new Driver(`http://localhost:4000`, false);
    await driver.init();
  });

  it('', async () => {
    await new Promise(resolve => setTimeout(resolve, 120000));
    await driver.goto('home');
    await new Promise(resolve => setTimeout(resolve, 60000));
  });
})