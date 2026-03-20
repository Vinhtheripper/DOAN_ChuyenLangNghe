const { FILESTACK_API_KEY, FILESTACK_STORE_LOCATION, FILESTACK_STORE_PATH } = require('../config/env');

const buildStoreUrl = (query = {}) => {
  const params = new URLSearchParams({ key: FILESTACK_API_KEY });

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  return `https://www.filestackapi.com/api/store/${FILESTACK_STORE_LOCATION}?${params.toString()}`;
};

const parseBase64Image = (value) => {
  if (!value || typeof value !== 'string' || !value.startsWith('data:')) {
    return null;
  }

  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
};

const getExtensionFromContentType = (contentType) => {
  const known = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  };

  return known[contentType] || 'bin';
};

const uploadBufferToFilestack = async ({ buffer, contentType, filename, pathPrefix = '' }) => {
  if (!FILESTACK_API_KEY) {
    throw new Error('Missing FILESTACK_API_KEY');
  }

  const storePath = `${FILESTACK_STORE_PATH}${pathPrefix}`.trim();
  const requestUrl = buildStoreUrl({
    filename,
    path: storePath || undefined
  });

  const formData = new FormData();
  formData.append('fileUpload', new Blob([buffer], { type: contentType }), filename);

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json'
    },
    body: formData
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Filestack upload failed: ${response.status} ${rawBody}`);
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error(`Filestack returned non-JSON response for ${requestUrl}: ${rawBody}`);
  }
};

module.exports = {
  parseBase64Image,
  uploadBufferToFilestack,
  getExtensionFromContentType
};
