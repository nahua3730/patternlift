// Opens a URL as its own resizable browser window (not a new tab in the
// same window), so it can be dragged beside the app and watched side by
// side without switching tabs.
export function openSideBySideWindow(url: string, windowName: string) {
  const width = Math.min(960, window.screen.availWidth - 80);
  const height = Math.min(640, window.screen.availHeight - 80);
  const left = window.screen.availWidth - width - 40;
  const top = 40;

  window.open(
    url,
    windowName,
    `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
  );
}
