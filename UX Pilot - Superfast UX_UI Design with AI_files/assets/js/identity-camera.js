document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-verification-camera');
  const checkButton = document.getElementById('check-verification-camera');
  const stopButton = document.getElementById('stop-verification-camera');
  const panel = document.getElementById('verification-camera-panel');
  const video = document.getElementById('verification-camera');
  const status = document.getElementById('camera-analysis-status');

  if (!startButton || !checkButton || !stopButton || !panel || !video || !status) return;

  let stream;
  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    video.srcObject = null;
    panel.hidden = true;
    startButton.disabled = false;
    checkButton.disabled = true;
  };

  startButton.addEventListener('click', async () => {
    status.textContent = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = 'Camera access is unavailable in this browser. Use a secure connection or a supported browser.';
      return;
    }

    startButton.disabled = true;
    status.textContent = 'Requesting camera access…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user' }
      });
      video.srcObject = stream;
      await video.play();
      panel.hidden = false;
      checkButton.disabled = false;
      status.textContent = 'Camera is on. Position your ID above your forehead and your face in the preview.';
    } catch (error) {
      console.error('Unable to open the identity-check camera.', error);
      stopCamera();
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        status.textContent = 'Camera permission was denied. Allow camera access in your browser settings and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        status.textContent = 'No camera was found on this device.';
      } else {
        status.textContent = 'The camera could not be opened. Check that it is available and try again.';
      }
    }
  });

  checkButton.addEventListener('click', () => {
    if (!stream || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      status.textContent = 'The camera preview is not ready. Start the camera and try again.';
      return;
    }

    stopCamera();
    status.textContent = 'Analysis unavailable: this page cannot detect an ID or compare it with your face. Your ID and face have not been analysed or verified. No image was saved or sent.';
  });

  stopButton.addEventListener('click', () => {
    stopCamera();
    status.textContent = 'Camera closed. No image was saved.';
  });

  window.addEventListener('pagehide', stopCamera);
});
