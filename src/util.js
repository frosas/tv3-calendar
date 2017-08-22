exports.delay = interval => new Promise(resolve => setTimeout(resolve, interval));

exports.retryify = func => {
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