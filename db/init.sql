CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_url TEXT,
    raw_text TEXT,
    doc_type VARCHAR(50),
    structured_json JSONB,
    validation JSONB,
    insights JSONB,
    decision JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);