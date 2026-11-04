/**
 * Resolves any audio URL into a playable URL for the browser.
 * Handles S3 URLs, relative server paths (/uploads/...), data URIs, and strips broken placeholder templates.
 */
export function resolveAudioUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Clean out any hardcoded template placeholder like https://{YOUR_S3_BUCKET}.s3.amazonaws.com/
  let cleanUrl = trimmed.replace(/^https?:\/\/\{[A-Z0-9_]+\}\.s3\.amazonaws\.com\/?/i, '');

  if (cleanUrl.startsWith('data:audio') || cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  // Ensure leading slash for server-hosted relative assets like /uploads/speaking/...
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }
  return `/${cleanUrl}`;
}

/**
 * URL the student player or results screen should load.
 * Checks all possible audio fields: student_audio_url, speaking_audio_url, audio_presigned_url, audio_url.
 */
export function getPlayableAudioUrl(item) {
  if (!item) return '';
  if (typeof item === 'string') return resolveAudioUrl(item);

  const raw =
    item.student_audio_url ||
    item.speaking_audio_url ||
    item.audio_presigned_url ||
    item.audio_url ||
    item.audio ||
    '';

  return resolveAudioUrl(raw);
}

/** Stable key for answers/recordings; must match multipart field question_<key> after shuffle. */
export function examQuestionAnswerKey(question, index = 0) {
  if (!question) return String(index);
  const id = question.question_id ?? question._id;
  if (id !== undefined && id !== null && `${id}` !== '') return String(id);
  return String(index);
}
