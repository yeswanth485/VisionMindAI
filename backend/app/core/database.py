import os
import logging
import time
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

# Import models to ensure they are registered with SQLModel
from app.models import Document, DocumentEmbedding

load_dotenv()
logger = logging.getLogger(__name__)

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Render/Heroku fix: SQLAlchemy requires 'postgresql://' but platforms often provide 'postgres://'
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Global engine - lazily created so we don't crash at import time if DATABASE_URL is missing
_engine = None

def get_engine():
    global _engine
    if _engine is None:
        url = DATABASE_URL or "postgresql://postgres:password@localhost/visionmind"
        logger.info("Creating database engine...")
        _engine = create_engine(url, echo=False)
    return _engine

def create_db_and_tables():
    """Create database tables with retry logic"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to connect to database... (Attempt {attempt + 1}/{max_retries})")
            SQLModel.metadata.create_all(get_engine())
            logger.info("Database tables verified/created successfully.")
            break
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
            if attempt < max_retries - 1:
                logger.info("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                logger.warning("Max retries reached. Application will start without DB tables.")

def get_session():
    """Dependency to get DB session"""
    with Session(get_engine()) as session:
        yield session