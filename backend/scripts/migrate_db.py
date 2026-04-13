import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print("--- Starting Database Migration ---")
    
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment!")
        return

    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Add columns if they don't exist
        columns_to_add = [
            ("input_type", "JSONB"),
            ("video_timeline", "JSONB"),
            ("agent_plan", "JSONB"),
            ("actions_taken", "JSONB")
        ]
        
        for col_name, col_type in columns_to_add:
            print(f"Adding column '{col_name}'...")
            try:
                # Use ALTER TABLE with ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+)
                cur.execute(f"ALTER TABLE documents ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
                print(f"Success: {col_name}")
            except Exception as e:
                print(f"⚠️ Warning during {col_name}: {e}")
                conn.rollback()
                # Continue with next column
                continue
        
        # Commit changes
        conn.commit()
        print("\nMigration Complete!")
        
        # Verify schema
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents';")
        rows = cur.fetchall()
        print("\nCurrent 'documents' schema:")
        for row in rows:
            print(f" - {row[0]}: {row[1]}")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Critical Migration Error: {e}")

if __name__ == "__main__":
    migrate()
