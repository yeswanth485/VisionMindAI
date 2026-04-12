import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    # OpenAI API Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Tesseract OCR Configuration
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "/usr/bin/tesseract")
    TESSDATA_PREFIX: str = os.getenv("TESSDATA_PREFIX", "/usr/share/tesseract-ocr/4.00/tessdata")
    
    # OpenRouter API Configuration (for multimodal services)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    
    # Other settings
    PROJECT_NAME: str = "VisionMind AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

settings = Settings()