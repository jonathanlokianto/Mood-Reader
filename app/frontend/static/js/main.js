const API_URL = "https://mood-reader-api-772386422944.us-central1.run.app";

const iconMap = {
      'angry': 'fa-angry',
      'disgust': 'fa-disgust',
      'fear': 'fa-fear',
      'happy': 'fa-happy',
      'neutral': 'fa-neutral',
      'sad': 'fa-sad',
      'surprise': 'fa-surprise'
};

let isManuallyCleared = false;
const imageSizeLimit = 10 * 1024 * 1024;


let selectedFile = null;
let selectedBox = 0;
let storedImageObj = null;
let facesData = [];

const imagePreviewObj = $('#imagePreview');
const imagePreviewText = $('#preview-text');
const canvas = document.getElementById('imagePreview'); 
const ctx = canvas.getContext('2d');

const fileInput = $('#file-input');
const classifyBtn = $('#classify-input');
const clearBtn = $('#clear-input');
const uploadForm = $('#upload-form');
const uploadButton = $('#upload-button');


const resultSection = $('#result-section');
const resultMood = $('#result-mood');
const resultConfidence = $('#result-confidence');
const resultIcon = $('#result-icon');


const errorArea = $('#error-area');
const errorMessage = $('#error-message');
const noFaceSection = $('#error-no-face-result-section');

const resultPlaceholder = $('#result-placeholder');
const loadingIndicator = $('#loading-indicator');


let isClassified = false;


clearBtn.on('click', function() {
      clearImagePreviewURL();
      isClassified = false;  
      manageElementForClear();
});

fileInput.on('change', async function(event) {
      if (event.target.files.length === 0) {
            if (isManuallyCleared) {
            isManuallyCleared = false;
            return;
            }
            clearImagePreviewURL();
            return;
      }
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
            errorHandler('Please upload a valid image file (JPG/PNG).');
            return;
      }
      if (!isFileSizeValid(file)) {
            errorHandler('File is too large! Please upload an image smaller than 10 MB.');
            return;
      }
      if (storedImageObj) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      try {
            const result = await resizeImage(file, 224);
            selectedFile = result.file; 
            facesData = [];
            selectedBox = 0;
            storedImageObj = null;
            isClassified = false;
            const previewImg = new Image();
            previewImg.onload = () => {
            storedImageObj = previewImg;
            canvas.width = previewImg.width;
            canvas.height = previewImg.height;
            ctx.drawImage(previewImg, 0, 0);
            canvas.style.display = 'block';
            imagePreviewText.hide();
            resultSection.hide();
            errorArea.hide();
            loadingIndicator.hide();
            resultPlaceholder.show();
            noFaceSection.hide();
            enableMainButtons();
            };
            previewImg.src = result.dataURL;
      } catch (error) {
            console.error("Error processing image:", error);
            errorHandler("Failed to process image.");
            loadingIndicator.hide();
      }
});


uploadForm.on('submit', async function(event) {
      event.preventDefault(); 
      if (!selectedFile) {
            return;
      }
      const FINAL_LIMIT = 5 * 1024 * 1024;
      if (selectedFile.size > FINAL_LIMIT) {
           showError("Error: Processed file is still too large. Please reduce the image size before uploading.");
           return;
      }
      disableMainButtons();
      hideError();
      processLoadingIndicator();
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
            const response = await fetch(API_URL + '/predict', {
                  method: 'POST',
                  body: formData,
            });
            const data = await response.json();
            if (data.error === true) {
                  displayNoFaceError();
            } else if (!response.ok) {
                  showError(data.detail || "There's an error on the server.");
            } else {

            facesData = data.results;
            selectedBox = 0;
            if(data.results.length > 0){
                  redrawCanvas();
                  updateInfoPanel(selectedBox);
                  resultPlaceholder.hide();
                  loadingIndicator.hide();
                  isClassified = true;  
                  }
            }
    } catch (error) {
        console.error("Fetch error:", error);
        showError("Unable to connect to the API Server.");
    } finally {
        enableMainButtons();
    }
});


function displayNoFaceError(){
      resultPlaceholder.hide();
      loadingIndicator.hide();
      noFaceSection.show();
      return;
}


function showResultSection() {
      loadingIndicator.hide();
      resultPlaceholder.hide();
      resultSection.show();
}

function showError(message) {
      loadingIndicator.hide();
      resultPlaceholder.removeClass('d-none').addClass('d-flex');
      resultSection.hide();
      noFaceSection.hide();

      errorMessage.text(message);
      errorArea.show();
}

function hideError() {
      errorArea.hide();
}



function manageElementForClear(){
      showInitialState();
      noFaceSection.hide();
      resultSection.hide();
      loadingIndicator.hide();
      imagePreviewText.show();
      hideError();
}

function processLoadingIndicator(){

      $('#result-placeholder').removeClass('d-flex').addClass('d-none');

      resultSection.hide();
      loadingIndicator.show();
      noFaceSection.hide();
      imagePreviewText.hide();
      errorArea.hide();
}

function disableMainButtons(){
      uploadButton.addClass('disabled');
      clearBtn.prop('disabled', true);
      classifyBtn.prop('disabled', true);
}

function enableMainButtons(){
      uploadButton.removeClass('disabled');
      clearBtn.prop('disabled', false);
      classifyBtn.prop('disabled', false);
}


function showInitialState(){
      loadingIndicator.hide();
      $('#result-placeholder').removeClass('d-none').addClass('d-flex');
      return;
}

function isFileSizeValid(file){
      if(file.size > imageSizeLimit){
            return false;
      }
      return true;
}


function clearImagePreviewURL(){      
      if (storedImageObj) {
            storedImageObj.src = '';
            storedImageObj = null;
      }
      selectedFile = null;
      fileInput.val('');

      ctx.clearRect(0,0, canvas.width, canvas.height);
      canvas.style.display = 'none';
      manageElementForClear();
}


function redrawCanvas() {
      if (!storedImageObj) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(storedImageObj, 0, 0, canvas.width, canvas.height);
      facesData.forEach((face, index) => {
            const { top, right, bottom, left } = face.box;

            ctx.beginPath();
            ctx.lineWidth = 5;
            if (index === selectedBox) {
                  ctx.strokeStyle = '#00FF00';
                  ctx.shadowColor = "rgba(0, 255, 0, 0.5)";
                  ctx.shadowBlur = 10;
            } else {
                  ctx.strokeStyle = '#FF0000';
                  ctx.shadowColor = "transparent";
                  ctx.shadowBlur = 0;
            }

            ctx.strokeRect(left, top, right - left, bottom - top);
            ctx.stroke();
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
    });
}


canvas.addEventListener('click', function(e) {
      if (!isClassified || facesData.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      facesData.forEach((face, index) => {
            const { top, right, bottom, left } = face.box;
            if (mouseX >= left && mouseX <= right && 
                  mouseY >= top && mouseY <= bottom) {
                  selectedBox = index;
                  redrawCanvas();
                  updateInfoPanel(index);
            }
      });
});


function updateInfoPanel(index) {
      showResultSection()
      const data = facesData[index];
      
      $('#result-mood').text(data.mood.toUpperCase());
      $('#result-confidence').text((data.confidence * 100).toFixed(0) + "%");
      
      const iconClass = iconMap[data.mood] || 'fa-happy';
      $('#result-icon').attr('class', 'fa tm-fa-6x tm-color-primary tm-margin-b-20 ' + iconClass);
}


function errorHandler(msg){
      selectedFile = null;
      storedImageObj = null;
      facesData = [];
      selectedBox = 0;
      isClassified = false;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none'; 
      imagePreviewText.show();       

      isManuallyCleared = true;
      fileInput[0].value = ''; 

      setTimeout(function() {
            showError(msg);
      }, 10);
      
      return;
}


function resizeImage(file, targetHeight) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const scaleFactor = targetHeight / img.height;
                const targetWidth = img.width * scaleFactor;
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    const resizedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve({
                        file: resizedFile,
                        imageObj: img,
                        dataURL: canvas.toDataURL('image/jpeg')
                    });
                }, 'image/jpeg', 0.95);
            };
            
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });}