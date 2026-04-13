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
     * Upload multiple documents for batch processing
     */
    batchUpload: async (files: File[]): Promise<{ids: string[]}> => {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        const response = await apiClient.post<{ids: string[]}>('/batch/upload', formData, {
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

/**
 * Multimodal AI Processing API
 */
export const multimodalAPI = {
    /**
     * Process video/audio/document through multimodal pipeline
     */
    process: async (file: File, userGoal?: string): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        if (userGoal) {
            formData.append('user_goal', userGoal);
        }

        const response = await apiClient.post('/multimodal/process', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

