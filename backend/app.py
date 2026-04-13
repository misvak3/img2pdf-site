from flask import Flask, request, send_file
from flask_cors import CORS
import img2pdf
import io
import os

app = Flask(__name__)
CORS(app, origins=[
    "https://okay0.netlify.app",  # Netlify URL
])

@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}

@app.route("/convert", methods=["POST"])
def convert():
    files = request.files.getlist("images")
    if not files:
        return {"error": "Şəkil göndərilmədi"}, 400

    images_bytes = [f.read() for f in files]

    try:
        pdf_bytes = img2pdf.convert(images_bytes)
    except Exception as e:
        return {"error": str(e)}, 500

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="converted.pdf"
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)