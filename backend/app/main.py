import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api.routes import router as api_router
from .api.rag_routes import router as rag_router
from .api.analytics_routes import router as analytics_router
from .api.batch_routes import router as batch_router
from .core.database import create_db_and_tables

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Ensure uploads directory exists early so StaticFiles doesn't crash on boot
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="VisionMind AI Document Intelligence System", version="1.0.0")

# Mount Static Files to serve uploaded documents
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS - Relaxed for production and preview environments
# This fixes Bug #6 (CORS blocking preview deployments)
origins = [
    "https://vision-mind-ai.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://vision-mind-ai-git-main-yeswanths-projects-1fd9ed30.vercel.app", # Specific preview
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production robustness during bug fixing, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Include API routes
app.include_router(api_router, prefix="/api")
app.include_router(rag_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(batch_router, prefix="/api")

from .api.multimodal_routes import router as multimodal_router
from .api.agent_routes import router as agent_router
app.include_router(multimodal_router, prefix="/api")
app.include_router(agent_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Application starting up... Initializing components.")
    create_db_and_tables()
    logger.info("Startup complete.")

@app.get("/")
async def root():
    return {"message": "VisionMind AI Document Intelligence System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}