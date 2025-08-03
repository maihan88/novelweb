import api from './api.ts';

/**
 * Uploads an image file to the server.
 * @param file The image file to upload.
 * @returns The URL of the uploaded image.
 */
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  // Note: We need to override the Content-Type header for file uploads.
  // Axios will automatically set the correct 'multipart/form-data' header
  // along with the boundary when you pass FormData as the body.
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // Backend returns { success: true, file: { url: '...' } }
  return response.data.file.url;
};
