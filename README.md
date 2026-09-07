# Mood Reader

A state-of-the-art web-based Facial Expression Recognition (FER) application powered by Deep Learning and Convolutional Neural Networks (CNN), utilizing the EfficientNetB0 architecture for real-time mood and emotion classification.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Prerequisites & System Requirements](#prerequisites--system-requirements)
- [Installation Guide](#installation-guide)
- [How to Run the Application](#how-to-run-the-application)
- [Troubleshooting](#troubleshooting)
- [Author](#author)

---

## About the Project

**Mood Reader** is an advanced computer vision and deep learning application designed to detect and classify human facial expressions in real-time. Built as part of an advanced image classification research project, the system leverages transfer learning with **EfficientNetB0** to accurately categorize human emotions into distinct psychological states (such as Happy, Sad, Angry, Surprised, Neutral, Fearful, and Disgusted).

The application captures input via webcam stream or image upload, detects facial regions using OpenCV, preprocesses the image features, and feeds them into the trained deep learning model to predict the user's current mood instantly.

---

## Key Features

- **Real-Time Facial Detection & Tracking** — Utilizes OpenCV cascades / bounding boxes to detect faces dynamically from video feeds or uploaded photos.
- **Deep Learning Transfer Learning** — Employs **EfficientNetB0** for superior feature extraction and high classification accuracy with optimal computational efficiency.
- **Multi-Class Emotion Classification** — Detects core emotional states with confidence score distributions.
- **Interactive Web Interface** — Clean, responsive frontend dashboard displaying live predictions, probability charts, and mood analytics.
- **Modular Codebase** — Well-structured architecture separating model training, data preprocessing, inference engines, and web routing.

---

## Tech Stack

| Category | Technologies |
| --- | --- |
| **Deep Learning / ML** | Python, TensorFlow / Keras, NumPy, Pandas, Scikit-Learn |
| **Computer Vision** | OpenCV (`cv2`), Pillow |
| **Backend / Web Framework** | Flask / FastAPI (Python) |
| **Frontend** | HTML5, CSS3, JavaScript, Tailwind CSS / Bootstrap |
| **Version Control & Deployment** | Git, GitHub, Netlify / Cloud Deployment pipelines |

---

## Project Architecture & Directory Structure

```text
Mood-Reader/
└── app/
    ├── backend/
    │   ├── app/
    │   │   ├── main.py / app.py    # Backend API Entry point
    │   │   ├── model/              # CNN Model (.h5 / .pth / .onnx)
    │   │   └── utils/              # Image processing & face detection
    │   ├── Dockerfile              # Dockerfile for Backend
    │   ├── requirements.txt        # Python Dependencies
    │   └── .env.example
    ├── frontend/
    │   ├── src/                    # React Components & Camera/Upload logic
    │   ├── public/
    │   ├── package.json
    │   ├── firebase.json           # Firebase Hosting Configuration
    │   ├── netlify.toml            # Netlify Configuration
    │   └── .env.example
    └── docker-compose.yml          # Local Docker Compose Configuration
```

---

## Prerequisites & System Requirements

Before you begin, ensure you have the following installed on your local machine:

- Python 3.9+ (Python 3.10 or 3.11 recommended)
- pip (Python package manager)
- Virtualenv (recommended for environment isolation)
- A working webcam (optional, for the real-time detection feature)

---

## Installation Guide

Follow these steps to set up the project locally.

**1. Clone the repository**

```bash
git clone https://github.com/jonathanlokianto/Mood-Reader.git
cd Mood-Reader
```

**2. Create and activate a virtual environment**

On Linux / macOS:

```bash
python3 -m venv venv
source venv/bin/activate
```

On Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

**3. Install dependencies**

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## How to Run the Application

### Option 1: Hosting Backend via Docker (Local Testing)

This method is used to test the entire application environment on a local machine within an isolated container before deploying to production.

#### A. Running Using Docker Compose (Backend + Frontend)

Ensure Docker Desktop / Docker Engine is running. Create a `docker-compose.yml` file in the project root folder (if it doesn't exist yet):

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - HOST=0.0.0.0
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
```

Run the containers:

```bash
docker-compose up --build -d
```

Access the application:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Documentation (Swagger): `http://localhost:8000/docs`

Stop the containers:

```bash
docker-compose down
```

#### B. Running Only Backend Docker Manually

```bash
# Build Docker Image
cd backend
docker build -t mood-reader-backend .

# Run Container
docker run -d -p 8000:8000 --name mood-backend-local mood-reader-backend
```

---

### Option 2: Backend on Google Cloud Run & Frontend on Firebase Hosting

This option is highly recommended for production scale (serverless & auto-scaling). Cloud Run handles Deep Learning inference with adequate CPU/RAM resources.

#### A. Deploy Backend to Google Cloud Run

**Login & set GCP project**

```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

**Enable required services**

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com artifactregistry.googleapis.com
```

**Build & push Docker image to Container Registry / Artifact Registry**

```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/mood-reader-backend:v1
```

**Deploy to Cloud Run**

```bash
gcloud run deploy mood-reader-backend \
  --image gcr.io/YOUR_GCP_PROJECT_ID/mood-reader-backend:v1 \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 8000
```

> **Note:** A minimum memory allocation of `2Gi` is recommended so the CNN model can be loaded into memory smoothly.

Note the generated Cloud Run URL (example: `https://mood-reader-backend-xyz-et.a.run.app`).

#### B. Deploy Frontend to Firebase Hosting

**Set API URL in frontend** — in `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://mood-reader-backend-xyz-et.a.run.app
```

**Initialize Firebase in the frontend folder**

```bash
cd frontend
npm run build   # Build production assets (dist / build folder)
npx firebase-tools login
npx firebase-tools init hosting
```

- Select your Firebase project.
- Set the public directory to `dist` (or `build`).
- Answer **Yes** for single-page app (SPA) rewrite.

**Deploy to Firebase**

```bash
npx firebase-tools deploy --only hosting
```

Access the frontend via the Firebase domain (example: `https://PROJECT_ID.web.app`).

---

### Option 3: Backend in Linux Environment + Ngrok & Frontend on Netlify

Suitable for quick testing without paid cloud infrastructure, where the backend runs directly on a Linux server (or Linux laptop) and is exposed using an Ngrok tunnel.

#### A. Run Backend on Linux & Setup Ngrok

**Run backend natively on Linux**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run Server (Gunicorn / Uvicorn)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Run Ngrok tunneling**

```bash
# Open a new terminal
ngrok http 8000
```

Ngrok will display an HTTPS forwarding URL, for example: `https://a1b2-123-456-789.ngrok-free.app`

**Handling CORS & Ngrok headers**: Ensure the backend allows CORS requests from the Netlify domain. If using the free version of Ngrok, the frontend needs to add the `ngrok-skip-browser-warning: true` header to every Axios/Fetch request.

#### B. Deploy Frontend to Netlify

**Method 1: Using Netlify CLI**

Set environment variable in `frontend/.env`:

```env
VITE_API_BASE_URL=https://a1b2-123-456-789.ngrok-free.app
```

Build & deploy:

```bash
cd frontend
npm run build
npx netlify-cli login
npx netlify-cli deploy --prod --dir=dist
```

**Method 2: Git Integration via Netlify Web Dashboard**

1. Push the frontend project to GitHub.
2. Open the Netlify Dashboard → **Add new site** → **Import an existing project**.
3. Connect with your GitHub repository.
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` or `build`
5. Go to **Site settings → Environment variables**, and add:
   - `VITE_API_BASE_URL` = `https://a1b2-123-456-789.ngrok-free.app`
6. Click **Deploy Site**.

---

## Troubleshooting

| Issue | Solution |
| --- | --- |
| **CORS Error** (Cross-Origin Resource Sharing) | Ensure the frontend URL (Firebase/Netlify) has been added to the allowed origins list in the backend CORS middleware (`CORS_ORIGINS`). |
| **Out of Memory (OOM)** during model inference on Cloud Run | Deep Learning models require RAM during weight loading. Increase the RAM allocation on Cloud Run to at least `--memory 2Gi` or `--memory 4Gi`. |
| **Ngrok warning page on frontend** | On the free version of Ngrok, include the `ngrok-skip-browser-warning: "true"` header in the HTTP request header on the frontend so the API is not blocked by Ngrok's interstitial warning page. |

---

## Author

**Jonathan Lokianto**

- GitHub: [@jonathanlokianto](https://github.com/jonathanlokianto)
- Degree: S.Kom. (Informatics Engineering)

© 2026 Mood-Reader Project. All rights reserved.
