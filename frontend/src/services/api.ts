import axios from 'axios';
import { DocumentResponse, UploadResponse } from '../types';

// Use the Vercel proxy defined in vercel.json to bypass all CORS issues
const API_BASE_URL = '/api';

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

    /**
     * Fetch all processed documents history
     */
    getHistory: async (): Promise<any[]> => {
        const response = await apiClient.get<any[]>('/documents');
        return response.data;
    },
};
