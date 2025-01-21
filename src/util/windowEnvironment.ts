import { IS_TEST, PRODUCTION_HOSTNAME } from '../config';

export function getPlatform() {
  const { userAgent, platform } = window.navigator;

  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
  if (
    iosPlatforms.indexOf(platform) !== -1
    // For new IPads with M1 chip and IPadOS platform returns "MacIntel"
    || (platform === 'MacIntel' && ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 2))
  ) return 'iOS';

  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  if (macosPlatforms.indexOf(platform) !== -1) return 'macOS';

  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  if (windowsPlatforms.indexOf(platform) !== -1) return 'Windows';

  if (/Android/.test(userAgent)) return 'Android';

  if (/Linux/.test(platform)) return 'Linux';

  return undefined;
}

export const IS_PRODUCTION_HOST = window.location.host === PRODUCTION_HOSTNAME;
export const PLATFORM_ENV = getPlatform();
export const IS_MAC_OS = PLATFORM_ENV === 'macOS';
export const IS_WINDOWS = PLATFORM_ENV === 'Windows';
export const IS_LINUX = PLATFORM_ENV === 'Linux';
export const IS_IOS = PLATFORM_ENV === 'iOS';
export const IS_ANDROID = PLATFORM_ENV === 'Android';
export const IS_MOBILE = IS_IOS || IS_ANDROID;
export const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
export const IS_YA_BROWSER = navigator.userAgent.includes('YaBrowser');
export const IS_FIREFOX = navigator.userAgent.toLowerCase().includes('firefox')
  || navigator.userAgent.toLowerCase().includes('iceweasel')
  || navigator.userAgent.toLowerCase().includes('icecat');
export const IS_ELECTRON = Boolean(window.electron);

export enum MouseButton {
  Main = 0,
  Auxiliary = 1,
  Secondary = 2,
  Fourth = 3,
  Fifth = 4,
}

export const IS_PWA = (
  window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator as any).standalone
  || document.referrer.includes('android-app://')
);

export const IS_APP = IS_PWA || IS_ELECTRON;

export const IS_TOUCH_ENV = window.matchMedia('(pointer: coarse)').matches;
export const IS_VOICE_RECORDING_SUPPORTED = Boolean(
  window.navigator.mediaDevices && 'getUserMedia' in window.navigator.mediaDevices && (
    window.AudioContext || (window as any).webkitAudioContext
  ),
);
export const IS_EMOJI_SUPPORTED = PLATFORM_ENV && (IS_MAC_OS || IS_IOS) && isLastEmojiVersionSupported();

export const IS_SERVICE_WORKER_SUPPORTED = 'serviceWorker' in navigator;
const chromeVersion = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)?.[2];
const hasBrokenServiceWorkerStreaming = chromeVersion && Number(chromeVersion) >= 132; // TODO: Update constraint when bug is fixed
// TODO Consider failed service worker
export const IS_PROGRESSIVE_SUPPORTED = IS_SERVICE_WORKER_SUPPORTED && !hasBrokenServiceWorkerStreaming;
export const IS_OPUS_SUPPORTED = Boolean((new Audio()).canPlayType('audio/ogg; codecs=opus'));
export const IS_CANVAS_FILTER_SUPPORTED = (
  !IS_TEST && 'filter' in (document.createElement('canvas').getContext('2d') || {})
);
export const IS_REQUEST_FULLSCREEN_SUPPORTED = 'requestFullscreen' in document.createElement('div');
export const ARE_CALLS_SUPPORTED = !IS_FIREFOX; // https://bugzilla.mozilla.org/show_bug.cgi?id=1923416
export const LAYERS_ANIMATION_NAME = IS_ANDROID ? 'slideFade' : IS_IOS ? 'slideLayers' : 'pushSlide';

export const IS_WAVE_TRANSFORM_SUPPORTED = !IS_MOBILE
  && !IS_FIREFOX // https://bugzilla.mozilla.org/show_bug.cgi?id=1808785
  && !IS_SAFARI; // https://bugs.webkit.org/show_bug.cgi?id=245510
export const IS_SNAP_EFFECT_SUPPORTED = !IS_MOBILE
  && !IS_FIREFOX // https://bugzilla.mozilla.org/show_bug.cgi?id=1896504
  && !IS_SAFARI;

const TEST_VIDEO = document.createElement('video');

export const IS_WEBM_SUPPORTED = Boolean(TEST_VIDEO.canPlayType('video/webm; codecs="vp9"').replace('no', ''));

export const ARE_WEBCODECS_SUPPORTED = 'VideoDecoder' in window;

export const MASK_IMAGE_DISABLED = true;
export const IS_OPFS_SUPPORTED = Boolean(navigator.storage?.getDirectory);
if (IS_OPFS_SUPPORTED) {
  // Clear old contents
  (async () => {
    try {
      const directory = await navigator.storage.getDirectory();
      await directory.removeEntry('downloads', { recursive: true });
    } catch {
      // Ignore
    }
  })();
}

export const IS_OFFSET_PATH_SUPPORTED = CSS.supports('offset-rotate: 0deg');
export const IS_BACKDROP_BLUR_SUPPORTED = CSS.supports('backdrop-filter: blur()')
  || CSS.supports('-webkit-backdrop-filter: blur()');
export const IS_INSTALL_PROMPT_SUPPORTED = 'onbeforeinstallprompt' in window;
export const IS_MULTITAB_SUPPORTED = 'BroadcastChannel' in window;
export const IS_OPEN_IN_NEW_TAB_SUPPORTED = IS_MULTITAB_SUPPORTED && !(IS_PWA && IS_MOBILE);
export const IS_TRANSLATION_SUPPORTED = !IS_TEST;
export const IS_INTL_LIST_FORMAT_SUPPORTED = 'ListFormat' in Intl;

export const IS_BAD_URL_PARSER = new URL('tg://host').host !== 'host';

export const MESSAGE_LIST_SENSITIVE_AREA = 750;

export const SCROLLBAR_WIDTH = (() => {
  const el = document.createElement('div');
  el.style.cssText = 'overflow:scroll; visibility:hidden; position:absolute;';
  el.classList.add('custom-scroll');
  document.body.appendChild(el);
  const width = el.offsetWidth - el.clientWidth;
  el.remove();

  document.documentElement.style.setProperty('--scrollbar-width', `${width}px`);

  return width;
})();

export const MAX_BUFFER_SIZE = (IS_MOBILE ? 512 : 2000) * 1024 ** 2; // 512 OR 2000 MB

function isLastEmojiVersionSupported() {
  const ALLOWABLE_CALCULATION_ERROR_SIZE = 5;
  const inlineEl = document.createElement('span');
  inlineEl.classList.add('emoji-test-element');
  document.body.appendChild(inlineEl);

  inlineEl.innerText = '🐦‍🔥'; // Emoji from 15.1 version
  const newEmojiWidth = inlineEl.offsetWidth;
  inlineEl.innerText = '❤️'; // Emoji from 1.0 version
  const legacyEmojiWidth = inlineEl.offsetWidth;

  document.body.removeChild(inlineEl);

  return Math.abs(newEmojiWidth - legacyEmojiWidth) < ALLOWABLE_CALCULATION_ERROR_SIZE;
}

export const IS_GEOLOCATION_SUPPORTED = 'geolocation' in navigator;

export const getGeolocationStatus = async () => {
  try {
    const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

    if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
      const geolocation = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error),
        );
      });
      return { accessRequested: true, accessGranted: true, geolocation };
    }
    if (permissionStatus.state === 'denied') {
      return { accessRequested: true, accessGranted: false };
    }
  } catch (error) {
    return { accessRequested: false, accessGranted: false };
  }

  return { accessRequested: false, accessGranted: false };
};
