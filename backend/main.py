from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os, psycopg2, json
from sql_validator import is_safe_select
import chromadb
from sentence_transformers import SentenceTransformer
import openai
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
import math

load_dotenv()

DB_URL = os.getenv("DB_URL")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
openai.api_key = OPENAI_KEY

app = FastAPI()
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

# Chroma client
chroma_client = chromadb.Client()
col = chroma_client.get_collection("argo_summaries") if chroma_client.list_collections() else None
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatIn(BaseModel):
    question: str

def get_db_connection():
    conn = psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
    return conn

def safe_float(x):
    return float(x) if x is not None and not math.isnan(x) else None

@app.post("/chat")
def chat(body: ChatIn):
    q = body.question.strip()
    # Very small rule-based mappings for key demo flows
    qlow = q.lower()
    if "salinity" in qlow or "salin" in qlow or "psal" in qlow:
        # Example: March 2023 near equator
        # We could call LLM to parse dates/region — but for MVP do a simple date/geo search fallback
        sql = """
        SELECT p.profile_id, p.float_id, p.timestamp, m.depth, m.value
        FROM profiles p JOIN measurements m ON m.profile_id = p.profile_id
        WHERE m.variable = 'psal'
          AND p.lat BETWEEN -2 AND 2
          AND p.timestamp >= '2023-03-01' AND p.timestamp < '2023-04-01'
        ORDER BY p.profile_id, m.depth;
        """
        return {"intent":"PLOT", "sql": sql, "viz": {"type":"depth_profile","x":"value","y":"depth","group_by":"profile_id"}, "explanation":"Salinity profiles near equator March 2023."}

    if "nearest floats" in qlow or ("nearest" in qlow and "float" in qlow):
        # Example parse coords from user naive; for production, pass to LLM
        lat, lon = 15.5, 70.2
        sql = f"""
        SELECT p.float_id, p.lat, p.lon,
          (6371 * acos(cos(radians({lat})) * cos(radians(p.lat)) * cos(radians(p.lon) - radians({lon}))
               + sin(radians({lat})) * sin(radians(p.lat)))) AS distance_km
        FROM profiles p
        GROUP BY p.float_id, p.lat, p.lon
        ORDER BY distance_km
        LIMIT 10;
        """
        return {"intent":"LOCATE","sql":sql,"viz":{"type":"table"},"explanation":"Nearest floats to (15.5N,70.2E)."}

    # If LLM key present, perform RAG -> LLM mapping
    if OPENAI_KEY and col is not None:
        # 1) embed question and retrieve top-k
        q_emb = embed_model.encode(q).tolist()
        results = col.query(query_embeddings=[q_emb], n_results=5)
        docs = []
        for rec in results['ids'][0]:
            # fetch document text
            # chroma result structure varies; use safe access
            pass
        # Build prompt (short schema + docs + question)
        prompt = f"""You are FloatChat. Database schema: floats(float_id), profiles(profile_id,float_id,timestamp,lat,lon), measurements(profile_id,variable,depth,value).
User question: {q}
Provide a JSON with: intent, sql, viz and explanation. SQL must be SELECT only.
Docs: (omitted)"""
        resp = openai.ChatCompletion.create(model="gpt-4o-mini", messages=[{"role":"user","content":prompt}], max_tokens=400)
        txt = resp['choices'][0]['message']['content']
        # Try to parse JSON in response
        try:
            j = json.loads(txt)
            # validate SQL
            if "sql" in j and not is_safe_select(j["sql"]):
                raise HTTPException(status_code=400, detail="Generated unsafe SQL")
            return j
        except Exception as e:
            return {"intent":"ERROR","explanation":"LLM failed to generate structured output; " + str(e)}
    # fallback
    return {"intent":"CLARIFY", "explanation":"I don't understand — try 'Show salinity near the equator in March 2023' or 'Nearest floats to (15.5N,70.2E)'"}


@app.post("/query")
def run_query(payload: dict):
    sql = payload.get("sql")
    if not sql or not is_safe_select(sql):
        raise HTTPException(400, "Unsafe or missing SQL")
    cur.execute(sql)
    cols = [d[0] for d in cur.description] if cur.description else []
    rows = cur.fetchall()
    return {"columns": cols, "rows": rows}

@app.get("/floats")
def list_floats():
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = f"""
    SELECT profile_id AS float_id,
           AVG(lat) AS avg_lat,
           AVG(lon) AS avg_lon
    FROM argo_profiles
    GROUP BY profile_id
    ORDER BY profile_id
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    
    # Close DB
    cur.close()
    conn.close()
    
    # Return JSON-friendly list
    return [
        {
            "float_id": r["float_id"],
            "lat": safe_float(r["avg_lat"]),
            "lon": safe_float(r["avg_lon"])
        }
        for r in rows
    ]



@app.get("/floats/{float_id}")
def get_float(float_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    query = """
        SELECT profile_id AS float_id, lat, lon, time, pres, temp, psal, level
        FROM argo_profiles
        WHERE profile_id = %s
        AND lat IS NOT NULL AND lat <> 'NaN'::float
        AND lon IS NOT NULL AND lon <> 'NaN'::float
        AND time IS NOT NULL
        AND pres IS NOT NULL AND pres <> 'NaN'::float
        AND temp IS NOT NULL AND temp <> 'NaN'::float
        AND psal IS NOT NULL AND psal <> 'NaN'::float
        AND level IS NOT NULL AND level <> 'NaN'::float
        ORDER BY time DESC
        """

    cur.execute(query, (float_id,))
    rows = cur.fetchall()

    cur.close()
    conn.close()

    if not rows:
        raise HTTPException(404, "Float not found")

    return {
        "float_id": float_id,
        "records": [
            {
                "lat": safe_float(r["lat"]),
                "lon": safe_float(r["lon"]),
                "time": r["time"].isoformat() if r["time"] else None,
                "pressure": safe_float(r["pres"]),
                "temperature": safe_float(r["temp"]),
                "salinity": safe_float(r["psal"]),
                "level": safe_float(r["level"]),
            }
            for r in rows
        ]
    }
