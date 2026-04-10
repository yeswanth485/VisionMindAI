import os
import logging
import time
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/visionmind")

# Render/Heroku fix: SQLAlchemy requires 'postgresql://' but platforms often provide 'postgres://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def create_db_and_tables():
    """Create database tables with retry logic to avoid immediate crash on Render"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to connect to database... (Attempt {attempt + 1}/{max_retries})")
            SQLModel.metadata.create_all(engine)
            logger.info("Database tables verified/created successfully.")
            break
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
            if attempt < max_retries - 1:
                logger.info("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                logger.warning("Max retries reached. Database initialization skipped. Application will try to start anyway, but endpoints requiring DB might fail.")

def get_session():
    """Dependency to get DB session"""
    with Session(engine) as session:
        yield session