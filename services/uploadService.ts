import api from './api.ts';

// Định nghĩa các loại upload
type UploadType = 'cover' | 'editor' | 'avatar';

/**
 * Uploads an image file to the server.
 * @param file The image file to upload.
 * @param type Loại ảnh: 'cover' (mặc định) hoặc 'editor' (nội dung)
 * @returns The URL of the uploaded image.
 */
export const uploadImage = async (file: File, type: UploadType = 'cover'): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post(`/upload?type=${type}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.file.url;
};