import os
import asyncio
import io
import uuid
import base64
from typing import Dict, Any, Optional
from pdf2image import convert_from_bytes
from PIL import Image
import openai
from dotenv import load_dotenv

# Import new services for Phase 2
from .rag_service import store_embedding
from .action_engine import suggest_actions
from app.core.ai_client import ai_client

load_dotenv()

class DocumentPipeline:
    def __init__(self):
        # Using the centralized AI client from app.core
        self.openai_client = ai_client
    
    async def preprocess(self, file_content: bytes, filename: str) -> list:
        """
        Convert PDF to images or load image file
        Returns list of PIL Images
        """
        if filename.lower().endswith('.pdf'):
            # Convert PDF to images in a separate thread
            images = await asyncio.to_thread(convert_from_bytes, file_content)
            return images
        else:
            # Load image file in a separate thread
            def _load_image():
                return Image.open(io.BytesIO(file_content)).copy()
            image = await asyncio.to_thread(_load_image)
            return [image]
    
    async def ocr_extract(self, images: list) -> str:
        """
        Extract text from images using GPT-4o-mini Vision via OpenRouter
        """
        full_text = ""
        
        # Process each image with GPT-4o-mini Vision
        for image in images:
            # Convert PIL image to base64
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            img_base64 = base64.b64encode(img_buffer.read()).decode('utf-8')
            
            # Call GPT-4o-mini Vision API (with OpenRouter prefix)
            try:
                response = await self.openai_client.chat.completions.create(
                    model="openai/gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Extract all text from this image. Preserve the original layout and formatting as much as possible. Return only the extracted text without any additional commentary."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{img_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=4000
                )
                
                text = response.choices[0].message.content.strip()
                full_text += text + "\n"
            except Exception as e:
                print(f"Vision API error: {e}")
                # Fallback to empty string for this image
                full_text += "\n"
                
        return full_text.strip()
    
    async def classify_document(self, text: str) -> str:
        """
        Use OpenAI to classify document type via OpenRouter
        """
        try:
            response = await self.openai_client.chat.completions.create(
                model="openai/gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a document classification expert. Classify the document text into EXACTLY ONE word from this list: invoice, receipt, contract, id_card, resume, bank_statement, medical_record, other. Return ONLY the single word. No punctuation, no explanation, no 'this document is'. If it looks like a CV or professional profile, return 'resume'."
                    },
                    {
                        "role": "user",
                        "content": f"Classify this text. Output only the category: {text[:2000]}"
                    }
                ],
                max_tokens=10,
                temperature=0.0
            )
            cat = response.choices[0].message.content.strip().lower()
            # Safety check to strip any residual punctuation or verbosity
            for keyword in ['invoice', 'receipt', 'contract', 'id_card', 'resume', 'bank_statement', 'medical_record']:
                if keyword in cat:
                    return keyword
            return "other"
        except Exception as e:
            print(f"Classification error: {e}")
            return "other"
    
    async def extract_structured_data(self, text: str, doc_type: str) -> Dict[str, Any]:
        """
        Use OpenAI to extract structured data via OpenRouter
        """
        try:
            # Define extraction prompts based on document type
            prompts = {
                "invoice": "Extract invoice data: invoice_number, date, vendor_name, customer_name, line_items (description, quantity, unit_price, total), subtotal, tax, total_amount",
                "receipt": "Extract receipt data: merchant_name, date, items (description, quantity, price), subtotal, tax, total_amount, payment_method",
                "contract": "Extract contract data: parties, effective_date, expiration_date, contract_value, key_terms",
                "id_card": "Extract ID card data: full_name, date_of_birth, id_number, expiration_date, issuing_authority",
                "bank_statement": "Extract bank statement data: account_number, statement_period, beginning_balance, ending_balance, transactions (date, description, amount)",
                "medical_record": "Extract medical record data: patient_name, date_of_birth, medical_record_number, provider_name, visit_date, diagnosis, prescribed_medications",
                "resume": "Extract resume data: full_name, email, phone, location, job_title, skills (list), experience_years, education (list of institutions and degrees), summary",
                "other": "Extract any key-value pairs or important information visible in the document"
            }
            
            prompt = prompts.get(doc_type, prompts["other"])
            
            response = await self.openai_client.chat.completions.create(
                model="openai/gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a data extraction expert. {prompt}. Return the data as a JSON object."
                    },
                    {
                        "role": "user",
                        "content": f"Extract structured data from this text: {text[:4000]}"
                    }
                ],
                max_tokens=1000,
                temperature=0.1
            )
            
            # Try to parse the response as JSON
            import json
            try:
                result = json.loads(response.choices[0].message.content)
                return result
            except json.JSONDecodeError:
                # If not valid JSON, return as text
                return {"extracted_text": response.choices[0].message.content}
                
        except Exception as e:
            print(f"Extraction error: {e}")
            return {"error": str(e)}
    
    async def validate_data(self, structured_data: Dict[str, Any], doc_type: str) -> Dict[str, Any]:
        """
        Use OpenAI to validate extracted data via OpenRouter
        """
        try:
            response = await self.openai_client.chat.completions.create(
                model="openai/gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a data validation expert. Validate the extracted data for completeness, consistency, and plausibility. Return a JSON object with validation results including: is_valid (boolean), validation_score (0-100), issues_found (list), and suggestions (list)."
                    },
                    {
                        "role": "user",
                        "content": f"Validate this {doc_type} data: {structured_data}"
                    }
                ],
                max_tokens=500,
                temperature=0.1
            )
            
            import json
            try:
                result = json.loads(response.choices[0].message.content)
                return result
            except json.JSONDecodeError:
                return {
                    "is_valid": False,
                    "validation_score": 0,
                    "issues_found": ["Failed to parse validation response"],
                    "suggestions": ["Please review the extracted data manually"]
                }
                
        except Exception as e:
            print(f"Validation error: {e}")
            return {
                "is_valid": False,
                "validation_score": 0,
                "issues_found": [f"Validation error: {str(e)}"],
                "suggestions": ["Please review the extracted data manually"]
            }
    
    async def generate_insights(self, structured_data: Dict[str, Any], doc_type: str) -> Dict[str, Any]:
        """
        Use OpenAI to generate insights via OpenRouter
        """
        try:
            response = await self.openai_client.chat.completions.create(
                model="openai/gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an insights generation expert. Analyze the document data and provide: summary (2-3 sentences), key_entities (list of important names/organizations/dates), risk_factors (list if applicable), recommendations (list of actionable items), improvements (what needs to be included to improve the file), and error_reduction (ways to decrease errors with the data/file). IF THE DOCUMENT IS A RESUME, also include: ats_score (0-100), ats_roadmap (list of specific steps to reach 99% compatibility), and missing_impact_keywords (list)."
                    },
                    {
                        "role": "user",
                        "content": f"Generate insights for this {doc_type} document: {structured_data}"
                    }
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            import json
            try:
                result = json.loads(response.choices[0].message.content)
                # Ensure the new fields exist
                if "improvements" not in result:
                    result["improvements"] = []
                if "error_reduction" not in result:
                    result["error_reduction"] = []
                if doc_type == "resume":
                    if "ats_score" not in result: result["ats_score"] = 70
                    if "ats_roadmap" not in result: result["ats_roadmap"] = ["Add metrics to experience", "Include missing tech keywords"]
                return result
            except json.JSONDecodeError:
                return {
                    "summary": response.choices[0].message.content[:200] + "...",
                    "key_entities": [],
                    "risk_factors": [],
                    "recommendations": ["Review the document manually for insights"],
                    "improvements": [],
                    "error_reduction": []
                }
                
        except Exception as e:
            print(f"Insights error: {e}")
            return {
                "summary": "Unable to generate insights due to processing error",
                "key_entities": [],
                "risk_factors": [],
                "recommendations": ["Please review the document manually"],
                "improvements": [],
                "error_reduction": []
            }
    
    async def make_decision(self, structured_data: Dict[str, Any], validation: Dict[str, Any], insights: Dict[str, Any], doc_type: str) -> Dict[str, Any]:
        """
        Use OpenAI to make decisions via OpenRouter
        """
        try:
            response = await self.openai_client.chat.completions.create(
                model="openai/gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a decision-making expert. Based on the document data, validation, and insights, provide: risk_level (low/medium/high), decision_status (approved/pending/rejected/requires_review), recommended_actions (list), and confidence_score (0-100)."
                    },
                    {
                        "role": "user",
                        "content": f"Make a decision for this {doc_type} document. Validation: {validation}, Insights: {insights}, Data: {structured_data}"
                    }
                ],
                max_tokens=600,
                temperature=0.2
            )
            
            import json
            try:
                result = json.loads(response.choices[0].message.content)
                return result
            except json.JSONDecodeError:
                return {
                    "risk_level": "medium",
                    "decision_status": "requires_review",
                    "recommended_actions": ["Manual review recommended due to processing issues"],
                    "confidence_score": 50
                }
                
        except Exception as e:
            print(f"Decision error: {e}")
            return {
                "risk_level": "high",
                "decision_status": "requires_review",
                "recommended_actions": [f"Error in decision processing: {str(e)}"],
                "confidence_score": 0
            }
    
    async def process_document(self, file_content: bytes, filename: str, document_id: uuid.UUID) -> Dict[str, Any]:
        """
        Main pipeline orchestrator
        """
        try:
            # Check if it's a JSON file - handle separately to avoid OCR
            if filename.lower().endswith('.json'):
                # Parse JSON directly
                import json
                try:
                    # Decode JSON content
                    json_data = json.loads(file_content.decode('utf-8'))
                    raw_text = json.dumps(json_data, indent=2)  # Pretty print for consistency
                    structured_data = json_data  # Use the parsed JSON directly
                    doc_type = "json_document"  # Special type for JSON files
                    
                    # Skip OCR and classification for JSON files
                    # Step 5: Validation
                    validation_result = await self.validate_data(structured_data, doc_type)
                    
                    # Step 6: Insights
                    insights_result = await self.generate_insights(structured_data, doc_type)
                    
                    # Step 7: Decision
                    decision_result = await self.make_decision(
                        structured_data, validation_result, insights_result, doc_type
                    )
                    
                    # Store embedding for RAG (background task - don't await to avoid blocking)
                    # Store the embedding with the actual document_id
                    try:
                        await store_embedding(document_id, raw_text)
                    except Exception as e:
                        print(f"Embedding storage error: {e}")
                    
                    # Generate action suggestions
                    try:
                        suggested_actions = await suggest_actions(
                            structured_data, 
                            doc_type, 
                            decision_result.get("risk_level", "medium")
                        )
                        # Add suggested actions to decision result
                        if "suggested_actions" not in decision_result:
                            decision_result["suggested_actions"] = suggested_actions
                    except Exception as e:
                        print(f"Action engine error: {e}")
                    
                    return {
                        "file_url": f"/uploads/{filename}",  # Placeholder - actual file storage would be implemented
                        "raw_text": raw_text,
                        "doc_type": doc_type,
                        "structured_json": structured_data,
                        "validation": validation_result,
                        "insights": insights_result,
                        "decision": decision_result,
                        "status": "completed"
                    }
                except json.JSONDecodeError as e:
                    # If JSON parsing fails, fall back to regular processing
                    print(f"JSON parsing failed, falling back to regular processing: {e}")
                    # Continue with regular processing below
                except Exception as e:
                    # If any other error occurs with JSON processing, fall back
                    print(f"JSON processing error, falling back to regular processing: {e}")
                    # Continue with regular processing below
            
            # Step 1: Preprocess (for non-JSON files)
            images = await self.preprocess(file_content, filename)
            
            # Step 2: OCR
            raw_text = await self.ocr_extract(images)
            
            # Step 3: Classification
            doc_type = await self.classify_document(raw_text)
            
            # Step 4: Structured Extraction
            structured_data = await self.extract_structured_data(raw_text, doc_type)
            
            # Step 5: Validation
            validation_result = await self.validate_data(structured_data, doc_type)
            
            # Step 6: Insights
            insights_result = await self.generate_insights(structured_data, doc_type)
            
            # Step 7: Decision
            decision_result = await self.make_decision(
                structured_data, validation_result, insights_result, doc_type
            )
            
            # Store embedding for RAG (background task - don't await to avoid blocking)
            # Store the embedding with the actual document_id
            try:
                await store_embedding(document_id, raw_text)
            except Exception as e:
                print(f"Embedding storage error: {e}")
            
            # Generate action suggestions
            try:
                suggested_actions = await suggest_actions(
                    structured_data, 
                    doc_type, 
                    decision_result.get("risk_level", "medium")
                )
                # Add suggested actions to decision result
                if "suggested_actions" not in decision_result:
                    decision_result["suggested_actions"] = suggested_actions
            except Exception as e:
                print(f"Action engine error: {e}")
            
            return {
                "file_url": f"/uploads/{filename}",  # Placeholder - actual file storage would be implemented
                "raw_text": raw_text,
                "doc_type": doc_type,
                "structured_json": structured_data,
                "validation": validation_result,
                "insights": insights_result,
                "decision": decision_result,
                "status": "completed"
            }
            
        except Exception as e:
            print(f"Pipeline error: {e}")
            return {
                "file_url": f"/uploads/{filename}",
                "raw_text": "",
                "doc_type": "error",
                "structured_json": {"error": str(e)},
                "validation": {"is_valid": False, "validation_score": 0},
                "insights": {"summary": "Processing failed"},
                "decision": {"risk_level": "high", "decision_status": "failed"},
                "status": "failed"
            }