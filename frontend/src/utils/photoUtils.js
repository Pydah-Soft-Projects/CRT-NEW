/**
 * Formats a photo value into a valid image URL/URI.
 * Supports raw base64, data URLs (data:image/...), and HTTP/HTTPS URLs.
 * 
 * @param {string|null|undefined} photo 
 * @returns {string|null}
 */
export const formatPhotoUrl = (photo) => {
  if (!photo) return null;
  const trimmed = String(photo).trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `data:image/jpeg;base64,${trimmed}`;
};

export default formatPhotoUrl;

