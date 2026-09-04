import io
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from PIL import Image
import numpy as np
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from pathlib import Path
import python_multipart
# from fastapi.templating import Jinja2Templates
import face_recognition



app = FastAPI(title="Mood Reader API")
CLASSES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
IMAGE_SIZE = 224
MODEL_PATH = r'ModelCNN.keras'

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "ModelCNN.keras"

STATIC_DIR = Path.cwd() / "static"
TEMPLATES_DIR = Path.cwd() / "templates"

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print(f"Model Keras berhasil dimuat.")
except Exception as e:
    print(f"GAGAL memuat model: {e}")
    model = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def preprocess_image(image_bytes: bytes) -> tf.Tensor:
    try:
        image_pil = Image.open(io.BytesIO(image_bytes))
        image_pil = image_pil.convert('RGB')
        image_np = np.array(image_pil)
        image = tf.convert_to_tensor(image_np)
    except Exception as e:
        raise ValueError(f"Failure while processing PIL. File maybe corrupted. Error: {e}")
    image = tf.image.rgb_to_grayscale(image)
    image = tf.image.adjust_contrast(image, 1.2)
    image = tf.image.grayscale_to_rgb(image)
    image = tf.image.resize(image, [IMAGE_SIZE, IMAGE_SIZE])
    image.set_shape([IMAGE_SIZE, IMAGE_SIZE, 3])
    image = tf.cast(image, tf.float32)
    image_batch = tf.expand_dims(image, axis=0)
    return image_batch

@app.get("/")
async def root():
    status = "Model Loaded" if model else "Model Failed"
    return {
        "message": "Mood Reader API is Running. Version 3",
        "model_status": status
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Failure while loading CNN model.")
    try:
        contents = await file.read()
        image_pil_full = Image.open(io.BytesIO(contents)).convert('RGB')
        image_np_full = np.array(image_pil_full)
        face_locations = face_recognition.face_locations(image_np_full, model="hog", number_of_times_to_upsample=1)

        if len(face_locations) == 0:
            return {
                "error": True
            }
        results = []
        for location in face_locations:
            top, right, bottom, left = location

            height = bottom - top
            width = right - left
            padding_h = int(height * 0.2)
            padding_w = int(width * 0.2)

            top = max(0, top - padding_h)
            bottom = min(image_np_full.shape[0], bottom + padding_h)
            left = max(0, left - padding_w)
            right = min(image_np_full.shape[1], right + padding_w)

            face_image_np = image_np_full[top:bottom, left:right]
            face_pil = Image.fromarray(face_image_np)
            img_byte_arr = io.BytesIO()
            face_pil.save(img_byte_arr, format='PNG')
            face_image_bytes = img_byte_arr.getvalue()
            image_batch = preprocess_image(face_image_bytes)
            predictions = model.predict(image_batch)
            
            prediction_array = predictions[0]
            top_idx = int(np.argmax(prediction_array))
            confidence = float(prediction_array[top_idx])
            predicted_class_label = CLASSES[top_idx]

            results.append({
            'box': {'top': top, 'right': right, 'bottom': bottom, 'left': left},
            'mood': predicted_class_label,
            'confidence': confidence
            })
        return {'results': results}
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Error internal: {e}")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)