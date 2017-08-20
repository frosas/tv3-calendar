const puppeteer = require('puppeteer');
const moment = require('moment-timezone');

module.exports = async () => {
  // These args are because https://github.com/GoogleChrome/puppeteer/issues/290
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto('http://www.ccma.cat/tv3/programacio/canal-tv3/');
  const episodes = (await page.evaluate(() => {
      return [].slice.call(document.querySelectorAll('.programes li')).map(el => {
        return {
          start: el.querySelector('.hora-programa time').getAttribute('datetime'),
          title: el.querySelector('.informacio-programa p strong').textContent
        };
      })
    }))
    .map(program => ({
      ...program,
      start: moment.tz(program.start, 'Europe/Madrid').toDate()
    }))
    .map((program, i, programs) => {
      return {
        ...program,
        end: (() => {
          const next = programs[i + 1];
          if (next) return next.start;
          // TODO Don't assume the last program ends at the same time the first 
          // program started that day.
          const date = new Date(programs[0].start);
          date.setDate(date.getDate() + 1);
          return date;
        })()
      };
    });
  browser.close(); // TODO Ensure it's called in case of error?
  return episodes;
};