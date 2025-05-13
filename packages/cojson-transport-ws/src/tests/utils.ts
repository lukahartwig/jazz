// biome-ignore lint/suspicious/noConfusingVoidType: Test helper
export function waitFor(callback: () => boolean | void) {
  return new Promise<void>((resolve, reject) => {
    const checkPassed = () => {
      try {
        return { ok: callback(), error: null };
      } catch (error) {
        return { ok: false, error };
      }
    };

    let retries = 0;

    const interval = setInterval(() => {
      const { ok, error } = checkPassed();

      if (ok !== false) {
        clearInterval(interval);
        resolve();
      }

      if (++retries > 10) {
        clearInterval(interval);
        reject(error);
      }
    }, 100);
  });
}
export function createPingTimeoutListener(
  enabled: boolean,
  timeout: number,
  callback: () => void,
) {
  if (!enabled) {
    return {
      reset() {},
      clear() {},
    };
  }

  let pingTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    reset() {
      pingTimeout && clearTimeout(pingTimeout);
      pingTimeout = setTimeout(() => {
        callback();
      }, timeout);
    },
    clear() {
      pingTimeout && clearTimeout(pingTimeout);
    },
  };
}
