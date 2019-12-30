import {Browser, Page, ElementHandle} from 'puppeteer';
import {baseURL} from './e2e-common';
import fetch from 'node-fetch';

const WAIT_TIMEOUT = 5000;

const element = async (page: Page, selector) => {
  if (page.waitForSelector) {
    await page.waitForSelector(selector, {timeout: WAIT_TIMEOUT});
  }

  return page.$(selector);
}

const elements = async (page: Page, selector) => {
  if (page.waitForSelector) {
    await page.waitForSelector(selector, {timeout: WAIT_TIMEOUT});
  }

  return page.$$(selector);
}

const evalOne = async (page: Page, selector, fn: (element: Element) => any) => {
  if (page.waitForSelector) {
    await page.waitForSelector(selector, {timeout: WAIT_TIMEOUT});
  }

  return page.$eval(selector, fn);
}

const evalMany = async (page: Page, selector, fn: (elements: Element[]) => any) => {
  if (page.waitForSelector) {
    await page.waitForSelector(selector, {timeout: WAIT_TIMEOUT});
  }

  return page.$$eval(selector, fn);
}

export class Driver {
  private readonly browser: Browser = browser;
  private page: Page;
  public mock: Mock;
  public url: URL;
  public query: Query;
  public click: Click;
  public evaluate: Evaluate;
  public log: Log;

  constructor(private readonly baseURL_ = baseURL, private readonly mockedServer = true) {}

  async init() {
    this.page = await this.browser.newPage();
    this.mock = new Mock(this.baseURL_);
    this.url = new URL(this.page);
    this.query = new Query(this.page);
    this.click = new Click(this.page);
    this.evaluate = new Evaluate(this.page);
    this.log = new Log(this.page);

    if (this.mockedServer) {
      await this.mock.reset();
    }

    return this;
  }

  async goto(state: string) {
    return this.page.goto(`${this.baseURL_}/#${state}`);
  }

  async sleep(ms: number) {
    return this.page.waitFor(ms);
  }

  createTestkit(TestkitCtor) {
    return new TestkitCtor(this.page);
  }
}

class Mock {
  constructor (private readonly baseURL_ = baseURL) {}

  async http(pattern: string, payload: any) {
    return fetch(`${this.baseURL_}/mock/pattern`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({pattern, payload})
    });
  }

  async reset() {
    return fetch(`${this.baseURL_}/mock/reset`);
  }
}

class URL {
  constructor (private readonly page: Page) {}

  async matches(pattern: string) {
    const fn = (p) => {
      const url = document.location.hash.replace('#', '');
      return (new ((window as any).UrlPattern)(p)).match(url) !== null;
    };

    await this.page.waitForFunction(fn, {timeout: WAIT_TIMEOUT}, pattern);

    return true;
  }
}

class Query {
  constructor (private readonly page: Page) {}

  async hook(hook: string, pseudoClass: string = '') {
    return element(this.page, `[data-hook="${hook}"]${pseudoClass}`);
  }

  async hooks(hook: string, pseudoClass: string = '') {
   return elements(this.page, `[data-hook="${hook}"]${pseudoClass}`);
  }

  async attr(attr: string, pseudoClass: string = '') {
    return element(this.page, `[${attr}]${pseudoClass}`);
  }

  async attrs(attr: string, pseudoClass: string = '') {
   return elements(this.page, `[${attr}]${pseudoClass}`);
  }

  async $(selector: string) {
    return element(this.page, selector);
  }

  async $$(selector: string) {
    return elements(this.page, selector);
  }
}

class Click {
  constructor (private readonly page: Page) {}

  async hook(hook: string, pseudoClass: string = '') {
    const el = await element(this.page, `[data-hook="${hook}"]${pseudoClass}`);

    if (el) {
      await el.click();
    }
  }

  async attr(attr: string, pseudoClass: string = '') {
    const el = await element(this.page, `[${attr}]${pseudoClass}`);

    if (el) {
      await el.click();
    }
  }

  async $(selector: string) {
    const el = await element(this.page, selector);

    if (el) {
      await el.click();
    }
  }
}

class Evaluate {
  constructor (private readonly page: Page) {}

  async hook(hook: string, fn: (element: Element) => any) {
    return evalOne(this.page, `[data-hook="${hook}"]`, fn);
  }

  async hooks(hook: string, fn: (element: Element[]) => any) {
   return evalMany(this.page, `[data-hook="${hook}"]`, fn);
  }

  async attr(attr: string, fn: (element: Element) => any) {
    return evalOne(this.page, `[${attr}]`, fn);
  }

  async attrs(attr: string, fn: (element: Element[]) => any) {
   return evalMany(this.page, `[${attr}]`, fn);
  }

  async $(selector: string, fn: (element: Element) => any) {
    return evalOne(this.page, selector, fn);
  }

  async $$(selector: string, fn: (element: Element[]) => any) {
    return evalMany(this.page, selector, fn);
  }
}

class Log {
  constructor (private readonly page: Page) {}

  async url() {
    /* tslint:disable-next-line:no-console */
    console.log(`Current page url is "${(await this.page.evaluate(() => document.location.hash)).replace('#', '')}"`);
  }

  async html() {
    /* tslint:disable-next-line:no-console */
    console.log(await this.page.evaluate(() => document.body.innerHTML));
  }
}

export class Testkit {
  public query: Query;
  public click: Click;
  public evaluate: Evaluate;

  constructor(pageOrElement: Page | ElementHandle) {
    if (!pageOrElement) {
      throw new Error('Got null page or element');
    }

    this.query = new Query(pageOrElement as Page);
    this.click = new Click(pageOrElement as Page);
    this.evaluate = new Evaluate(pageOrElement as Page);
  }
}
