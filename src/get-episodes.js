const moment = require("moment-timezone");
const log = require("debug")("app:getEpisodes");
const browserDebug = require("debug")("app:getEpisodes:browser:debug");
const Browser = require("./browser");

const browser = new Browser();

const usePage = async callback => {
  const page = await browser.createPage();
  page.on("console", browserDebug);
  try {
    return await callback(page);
  } finally {
    await page.close();
  }
};

const getPageActiveDayEpisodesData = async page => {
  return page.evaluate(() => {
    return [].slice
      .call(
        document.querySelectorAll(
          ".swipertable + * .tab-pane.active .programes li"
        )
      )
      .map(el => {
        return {
          start: el
            .querySelector(".hora-programa time")
            .getAttribute("datetime"),
          program: (() => {
            const pEl = el.querySelector(".informacio-programa p:nth-child(1)");
            return {
              title: pEl.textContent.trim(),
              url: (() => {
                const aEl = pEl.querySelector("a");
                if (aEl)
                  return new URL(aEl.getAttribute("href"), location).toString();
              })()
            };
          })(),
          title: el
            .querySelector(".informacio-programa p:nth-child(2)")
            .textContent.trim(),
          description: el.querySelector(".mostraInfo p").textContent.trim()
        };
      });
  });
};

const getPageData = async channelUrl => {
  return usePage(async page => {
    log(`Opening page ${channelUrl}...`);
    await page.goto(channelUrl);
    // Remove tracking cookie dialog
    await page.evaluate(() => {
      const el = document.querySelector("#trackingCookie");
      el && el.parentNode.removeChild(el);
    });
    return (await page.$$(".swipertable li a")).reduce(
      async (whenEpisodesData, el) => {
        const episodesData = await whenEpisodesData;
        const day = await page.evaluate(
          el => el.querySelector(".titol").textContent,
          el
        );
        log(`Obtaining episodes data for "${day}"...`);
        await el.click();
        await page.waitForSelector(".swipertable + * .tab-pane.active *");
        return episodesData.concat(await getPageActiveDayEpisodesData(page));
      },
      Promise.resolve([])
    );
  });
};

module.exports = async channelUrl => {
  return (
    (await getPageData(channelUrl))
      .map(episode => ({
        ...episode,
        start: moment.tz(episode.start, "Europe/Madrid").toDate()
      }))
      .map((episode, i, episodes) => {
        return {
          ...episode,
          end: (() => {
            const next = episodes[i + 1];
            if (next) return next.start;
          })()
        };
      })
      // Ignore episodes without an ending date. It should be only the latest episode.
      .filter(episode => episode.end)
  );
};
