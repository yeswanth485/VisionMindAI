import axios from 'axios';
import { DocumentResponse, UploadResponse } from '../types';

// Force the correct Render backend to ignore any cached invalid environment variables in Vercel
const API_BASE_URL = 'https://visionmind-backend.onrender.com/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const documentAPI = {
    /**
     * Upload a document for processing
     */
    upload: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<UploadResponse>('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Fetch document status and results
     */
    getDocument: async (id: string): Promise<DocumentResponse> => {
        const response = await apiClient.get<DocumentResponse>(`/document/${id}`);
        return response.data;
    },
};
