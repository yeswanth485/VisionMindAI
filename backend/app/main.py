from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.core.database import create_db_and_tables

app = FastAPI(title="VisionMind AI Document Intelligence System", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_db_and_tables()

@app.get("/")
async def root():
    return {"message": "VisionMind AI Document Intelligence System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}