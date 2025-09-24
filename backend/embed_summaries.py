from sentence_transformers import SentenceTransformer
import chromadb
import psycopg2

MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)
client = chromadb.Client()
col = client.create_collection("argo_summaries", exist_ok=True)

conn = psycopg2.connect("postgres://argo:argo@db:5432/argo")
cur = conn.cursor()
cur.execute("SELECT float_id, COUNT(*), MIN(timestamp), MAX(timestamp) FROM profiles GROUP BY float_id")
rows = cur.fetchall()
for float_id, count, tmin, tmax in rows:
    summary = f"Float {float_id}: {count} profiles from {tmin} to {tmax} in Indian Ocean. Variables include T,S and BGC maybe."
    emb = model.encode(summary).tolist()
    # upsert to chroma
    col.upsert(ids=[str(float_id)], documents=[summary], embeddings=[emb])
print("Embeddings done")
