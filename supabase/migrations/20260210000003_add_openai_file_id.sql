-- Añadir columna openai_file_id a la tabla rag_documents
-- Esta columna almacenará el ID del archivo en OpenAI Vector Store
-- para permitir sincronización dual entre Gemini File Search y OpenAI

ALTER TABLE rag_documents 
ADD COLUMN IF NOT EXISTS openai_file_id TEXT NULL;

-- Crear índice para búsquedas por openai_file_id
CREATE INDEX IF NOT EXISTS idx_rag_documents_openai_file_id 
ON rag_documents(openai_file_id) 
WHERE openai_file_id IS NOT NULL;
