const SESSION_INACTIVITY_TIMEOUT_MS = 40 * 60 * 1000;
const LAST_ACTIVITY_KEY = "session-last-activity";
const LOGOUT_BROADCAST_KEY = "session-timeout-logout";
const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "scroll",
  "touchstart",
  "focus",
];

const inactivityService = {
  timeoutId: null,
  timeoutMs: SESSION_INACTIVITY_TIMEOUT_MS,
  lastActivityAt: 0,
  started: false,
  timingOut: false,
  onTimeout: null,

  start({ onTimeout, timeoutMs = SESSION_INACTIVITY_TIMEOUT_MS } = {}) {
    if (typeof window === "undefined") {
      return;
    }

    inactivityService.stop();

    inactivityService.onTimeout = onTimeout;
    inactivityService.timeoutMs = timeoutMs;
    inactivityService.started = true;
    inactivityService.timingOut = false;

    inactivityService.markActivity();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, inactivityService.handleActivity, {
        passive: true,
      });
    });

    document.addEventListener(
      "visibilitychange",
      inactivityService.handleVisibilityChange,
    );
    window.addEventListener("storage", inactivityService.handleStorage);
  },

  stop() {
    if (typeof window === "undefined") {
      return;
    }

    inactivityService.clearTimer();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, inactivityService.handleActivity);
    });

    document.removeEventListener(
      "visibilitychange",
      inactivityService.handleVisibilityChange,
    );
    window.removeEventListener("storage", inactivityService.handleStorage);

    inactivityService.started = false;
    inactivityService.timingOut = false;
    inactivityService.onTimeout = null;
  },

  clearTimer() {
    if (inactivityService.timeoutId) {
      window.clearTimeout(inactivityService.timeoutId);
      inactivityService.timeoutId = null;
    }
  },

  scheduleCheck(delayMs = inactivityService.timeoutMs) {
    inactivityService.clearTimer();
    inactivityService.timeoutId = window.setTimeout(() => {
      inactivityService.checkForTimeout();
    }, delayMs);
  },

  markActivity(shouldBroadcast = true) {
    if (!inactivityService.started || inactivityService.timingOut) {
      return;
    }

    const now = Date.now();
    inactivityService.lastActivityAt = now;

    if (shouldBroadcast) {
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    }

    inactivityService.scheduleCheck(inactivityService.timeoutMs);
  },

  checkForTimeout() {
    if (!inactivityService.started || inactivityService.timingOut) {
      return;
    }

    const elapsed = Date.now() - inactivityService.lastActivityAt;

    if (elapsed >= inactivityService.timeoutMs) {
      inactivityService.triggerTimeout();
      return;
    }

    inactivityService.scheduleCheck(inactivityService.timeoutMs - elapsed);
  },

  async triggerTimeout(shouldBroadcast = true) {
    if (!inactivityService.started || inactivityService.timingOut) {
      return;
    }

    inactivityService.timingOut = true;

    if (shouldBroadcast) {
      window.localStorage.setItem(LOGOUT_BROADCAST_KEY, String(Date.now()));
    }

    const onTimeout = inactivityService.onTimeout;
    inactivityService.stop();

    await onTimeout?.();
  },

  handleActivity() {
    inactivityService.markActivity();
  },

  handleVisibilityChange() {
    if (document.visibilityState !== "visible") {
      return;
    }

    inactivityService.checkForTimeout();
  },

  handleStorage(event) {
    if (!inactivityService.started || inactivityService.timingOut) {
      return;
    }

    if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
      const activityAt = Number(event.newValue);

      if (!Number.isNaN(activityAt) && activityAt > 0) {
        inactivityService.lastActivityAt = activityAt;
        inactivityService.scheduleCheck(
          Math.max(inactivityService.timeoutMs - (Date.now() - activityAt), 0),
        );
      }
    }

    if (event.key === LOGOUT_BROADCAST_KEY && event.newValue) {
      inactivityService.triggerTimeout(false);
    }
  },
};

export { SESSION_INACTIVITY_TIMEOUT_MS };
export default inactivityService;
