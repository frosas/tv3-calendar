const puppeteer = require('puppeteer');
const moment = require('moment-timezone');

const browser = new class {
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
}

const getPageData = async channelUrl => {
  const page = await browser.createPage();
  try {
    await page.goto(channelUrl);
    return (await page.evaluate(() => {
      return [].slice.call(document.querySelectorAll('.programes li')).map(el => {
        return {
          start: el.querySelector('.hora-programa time').getAttribute('datetime'),
          program: (() => {
            const pEl = el.querySelector('.informacio-programa p:nth-child(1)');
            return {
              title: pEl.textContent,
              url: (() => {
                const aEl = pEl.querySelector('a');
                if (aEl) return new URL(aEl.getAttribute('href'), location).toString();
              })()
            };
          })(),
          title: el.querySelector('.informacio-programa p:nth-child(2)').textContent,
          description: el.querySelector('.mostraInfo p').textContent.trim()
        };
      })
    }));
  } finally {
    page.close();
  }
};

module.exports = async channelUrl => {
  const episodes = (await getPageData(channelUrl))
    .map(episode => ({
      ...episode,
      start: moment.tz(episode.start, 'Europe/Madrid').toDate()
    }))
    .map((episode, i, episodes) => {
      return {
        ...episode,
        end: (() => {
          const next = episodes[i + 1];
          if (next) return next.start;
          // TODO Don't assume the last program ends at the same time the first 
          // program started that day.
          const date = new Date(episodes[0].start);
          date.setDate(date.getDate() + 1);
          return date;
        })()
      };
    });
  return episodes;
};