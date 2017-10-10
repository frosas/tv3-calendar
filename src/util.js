const util = exports;

util.delay = interval => new Promise(resolve => setTimeout(resolve, interval));

/**
 * @return {Promise}
 */
util.retryify = func => {
  return (...args) => {
    return (async function retriedFunc(params = {args, attempt: 1}) {
      try {
        return await func(params);
      } catch (error) {
        return retriedFunc({...params, error, attempt: params.attempt + 1});
      }
    })();
  };
};

/**
 * @param {Array<Promise>} promises 
 * @return {Promise<Array<Promise>>} It resolves with the promises once all of 
 *   them have resolved, or it rejects with the same promises if any of them have 
 *   rejected. Similar to `Promise.all()` with the difference it both waits for 
 *   and returns all the promises no matter whether they were resolved or rejected.
 */
util.whenEvery = async promises => {
  let rejected;
  await Promise.all(promises.map(promise => promise.catch(() => { rejected = true; })));
  if (rejected) throw promises;
  return promises;
};
