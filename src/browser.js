const puppeteer = require("puppeteer");
const log = require("debug")("app:browser");

module.exports = class {
  async createPage() {
    try {
      return await (await this._getInstance()).newPage();
    } catch (error) {
      // Avoid using a browser instance which can be in a bad state (e.g. Chromium
      // process is dead)
      this._stopInstance();
      throw error;
    }
  }

  _getInstance() {
    if (!this._whenInstance) {
      log("Starting instance...");
      // These args are because https://github.com/GoogleChrome/puppeteer/issues/290
      this._whenInstance = puppeteer.launch({ args: ["--no-sandbox"] });
    }
    return this._whenInstance;
  }

  _stopInstance() {
    if (!this._whenInstance) return;
    this._whenInstance.then(instance => {
      log("Stopping instance...");
      instance.close();
    });
    this._whenInstance = null;
  }
};
