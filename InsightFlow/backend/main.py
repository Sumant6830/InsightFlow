
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import json

app = FastAPI(
    title="InsightFlow API",
    description="Backend API for business analytics",
    version="1.0.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "InsightFlow API is running!",
        "status": "success"
    }


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):

    filename = file.filename or ""
    extension = filename.rsplit(".", 1)[-1].lower()

    # Validate file format
    if extension not in ["csv", "xlsx", "xls"]:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported."
        )

    try:
        contents = await file.read()

        # Validate file size (10 MB)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="File must be smaller than 10 MB."
            )

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty."
            )

        # Read CSV or Excel
        if extension == "csv":
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="The uploaded dataset contains no records."
            )

        # Clean column names
        df.columns = [str(column).strip() for column in df.columns]

        # Numeric column analysis
        numeric_df = df.select_dtypes(include="number")

        numeric_totals = {
            str(column): float(numeric_df[column].sum())
            for column in numeric_df.columns
        }

        # Convert all records into JSON-safe Python data
        # This also handles NaN, dates and NumPy values.
        records = json.loads(
            df.to_json(
                orient="records",
                date_format="iso"
            )
        )

        # First 10 records for preview
        preview = records[:10]

        # Final response
        return {
            "message": "Dataset processed successfully",
            "filename": filename,

            "metrics": {
                "total_records": int(len(df)),
                "total_columns": int(len(df.columns)),
                "numeric_columns": [
                    str(column)
                    for column in numeric_df.columns
                ],
                "numeric_totals": numeric_totals
            },

            "columns": [
                str(column)
                for column in df.columns
            ],

            "preview": preview,

            # IMPORTANT: Complete dataset for dashboard calculations
            "records": records
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to process file: {str(error)}"
        )
