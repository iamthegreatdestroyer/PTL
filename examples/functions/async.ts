/**
 * Async function inference examples
 *
 * PTL understands async/await patterns and Promise types.
 */

// Basic async function
async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Async with error handling
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
    }
  }
  throw new Error('Failed after retries');
}

// Parallel async operations
async function fetchAll(urls) {
  const promises = urls.map((url) => fetch(url));
  const responses = await Promise.all(promises);
  return Promise.all(responses.map((r) => r.json()));
}

// Async generator
async function* paginate(baseUrl, pageSize = 10) {
  let page = 0;
  while (true) {
    const response = await fetch(`${baseUrl}?page=${page}&size=${pageSize}`);
    const data = await response.json();
    if (data.items.length === 0) {
      break;
    }
    yield data.items;
    page++;
  }
}

// Callback to Promise conversion
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  };
}

// Timeout wrapper
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });
  return Promise.race([promise, timeout]);
}

// Debounced async function
function debounceAsync(fn, ms) {
  let timeoutId = null;
  let pendingPromise = null;

  return async function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, ms);
    });
  };
}

export { fetchData, fetchWithRetry, fetchAll, paginate, promisify, withTimeout, debounceAsync };
