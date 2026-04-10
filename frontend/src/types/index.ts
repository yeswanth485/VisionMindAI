export interface DocumentResponse {
    id: str;
    file_url?: string;
    raw_text?: string;
    doc_type?: string;
    structured_json?: any;
    validation?: any;
    insights?: any;
    decision?: any;
    status: string;
    created_at?: string;
}

export interface UploadResponse {
    message: string;
    document_id: string;
    status: string;
}
