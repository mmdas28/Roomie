import "@testing-library/dom";

// jsdom doesn't implement these; the app touches them defensively.
if (!("matchMedia" in window)) {
  // @ts-expect-error minimal shim
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
}
