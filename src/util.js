const util = exports;

util.delay = interval => new Promise(resolve => setTimeout(resolve, interval));

/**
 * @return {Promise}
 */
util.retryify = func => {
  return (...args) => {
    return (async function retriedFunc(params = { args, attempt: 1 }) {
      try {
        return await func(params);
      } catch (error) {
        return retriedFunc({ ...params, error, attempt: params.attempt + 1 });
      }
    })();
  };
};
