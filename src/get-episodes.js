const moment = require('moment-timezone');
const Browser = require('./browser');

const browser = new Browser();

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
    await page.close();
  }
};

module.exports = async channelUrl => {
  return (await getPageData(channelUrl))
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
};