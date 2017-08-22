const puppeteer = require('puppeteer');

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
      console.log('Starting browser...');
      // These args are because https://github.com/GoogleChrome/puppeteer/issues/290
      this._whenInstance = puppeteer.launch({args: ['--no-sandbox']});
    }
    return this._whenInstance;
  }

  _stopInstance() {
    if (!this._whenInstance) return;
    this._whenInstance.then(instance => {
      console.log('Stopping browser...');
      instance.close();          
    });
    this._whenInstance = null;
  }
};
