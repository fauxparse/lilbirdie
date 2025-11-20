export const hostname = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
  }
};
