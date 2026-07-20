import client from './client';
import { FileAttachment } from '../types';

export const filesApi = {
  upload: async (decisionId: number, file: File): Promise<FileAttachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await client.post<FileAttachment>(
      `/api/decisions/${decisionId}/files/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  list: async (decisionId: number): Promise<FileAttachment[]> => {
    const response = await client.get<FileAttachment[]>(
      `/api/decisions/${decisionId}/files/`
    );
    return response.data;
  },

  getDownloadUrl: (decisionId: number, fileId: number): string => {
    return `/api/decisions/${decisionId}/files/${fileId}/download`;
  },

  delete: async (decisionId: number, fileId: number): Promise<void> => {
    await client.delete(`/api/decisions/${decisionId}/files/${fileId}`);
  },
};
