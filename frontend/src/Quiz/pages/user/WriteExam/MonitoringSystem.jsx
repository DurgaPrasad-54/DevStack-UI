import axios from 'axios';
import { message } from 'antd'; // Import message from antd
import config from '../../../../config';


const MonitoringSystem = {
    stream: null,
    videoElement: null,
    audioCanvas: null,
    audioContext: null,
    analyser: null,
    animationFrame: null,
    isActive: false,
    isUserPresent: true, // Flag for user presence
    lastPresenceCheckTime: null, // Track last check to prevent too frequent calls
    presenceCheckInterval: 10000, //  Presence check frequency
    inactivityThreshold: 20000,  // Time after user inactive we consider a absence of the user
    presenceDetectedTime: null,   // tracks the presence check if presence is active, if the check is inactive it gets back to null
    tabSwitchCount: 0,
    showWarningModal: false,
    faceDetectionSupported: 'FaceDetector' in window ? window.FaceDetector : null, // Define FaceDetector

    async requestPermissions() {
        try {
            // Create video element for displaying camera feed
            this.videoElement = document.createElement('video');
            this.videoElement.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 180px;
                width: 160px;
                height: 120px;
                border-radius: 8px;
                object-fit: cover;
                z-index: 1001;
                border: 2px solid #4a90e2;
            `;
            this.videoElement.muted = true;
            document.body.appendChild(this.videoElement);

            // Create canvas for audio visualization
            this.audioCanvas = document.createElement('canvas');
            this.audioCanvas.width = 160;
            this.audioCanvas.height = 120;
            this.audioCanvas.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                width: 160px;
                height: 120px;
                border-radius: 8px;
                z-index: 1001;
                border: 2px solid #4a90e2;
                background-color: #000;
            `;
            document.body.appendChild(this.audioCanvas);

            // Request both camera and microphone permissions
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {ideal: 1280},
                    height: {ideal: 720}
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Attach stream to video element
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();

            this.isActive = true;
            this.updateMonitoringUI(true);

            // Initialize audio context and analyzer
            this.initAudioAnalyzer();

            // Start visualization
            this.visualizeAudio();

            this.startPresenceCheckInterval();  // start face presence check interval

            this.addSecurityListeners(); // Add security listeners

            return true;
        } catch (error) {
            console.error('Permission denied:', error);
            this.updateMonitoringUI(false);
            this.showPermissionError();
            return false;
        }
    },
    initAudioAnalyzer() {
        this.audioContext = new AudioContext();
        const audioSource = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();

        // Adjust these values to make the visualization more responsive to voice
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;

        audioSource.connect(this.analyser);
    },

    visualizeAudio() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = this.audioCanvas;
        const canvasCtx = canvas.getContext('2d');
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        const draw = () => {
            this.animationFrame = requestAnimationFrame(draw);

            // Get time domain data for waveform
            this.analyser.getByteTimeDomainData(dataArray);

            // Clear canvas with semi-transparent black for trail effect
            canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            // Draw frequency line
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#00ff00';
            canvasCtx.beginPath();

            const sliceWidth = WIDTH * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * HEIGHT / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            // Add center line
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();

            // Add text indicator for audio level
            const audioLevel = this.checkAudioLevels();
            if (audioLevel > 30 && this.isUserPresent) {
                canvasCtx.fillStyle = '#00ff00';
                canvasCtx.font = '12px Arial';
                canvasCtx.fillText('Voice Detected', 5, 15);
             }
              else if(!this.isUserPresent){
                   canvasCtx.fillStyle = '#ff0000';
                 canvasCtx.font = '12px Arial';
                 canvasCtx.fillText('No Presence', 5, 15);
           }
        };

        draw();
    },

    startPresenceCheckInterval() {
        setInterval(async () => {
            if (this.isActive) {
                const now = Date.now();
                if (
                    !this.lastPresenceCheckTime ||
                    now - this.lastPresenceCheckTime >= this.presenceCheckInterval
                ) {
                    await this.checkUserPresence();
                    this.lastPresenceCheckTime = now;
                }
            }
        }, 2000) // checks presence for each 2 second and if threshold cross it submits report.
    },

    async checkUserPresence() {
         try {
            if(!this.stream) {
              return false; // Exit early if the stream doesn't exist.
           }
             const videoTrack = this.stream.getVideoTracks()[0];

              if (!videoTrack) {
                console.log('No video track to analyse.');
                return false; //Exit early is no video track
                }

           const imageCapture = new ImageCapture(videoTrack);
            const bitmap = await imageCapture.grabFrame();
            if(this.faceDetectionSupported){  // only works when https is supported or in all secure sites, else this should show no features

           const faceDetection = new this.faceDetectionSupported(); // try face api check, since all user have the support
                const faces = await faceDetection.detect(bitmap);
                 this.lastPresenceCheckTime = Date.now();
              if(faces.length > 0){
                     if (!this.isUserPresent){
                            this.presenceDetectedTime = Date.now()  // we mark this only first time so other timer does not triggers on non presence events.

                        }

                   this.isUserPresent = true;
                      console.log('User present');

              }else{

                    if (this.isUserPresent) { // if currently we have is present value as true we initiate absence process by checking presence detection timt

                            if(this.presenceDetectedTime && Date.now() - this.presenceDetectedTime >= this.inactivityThreshold ){
                               this.isUserPresent = false;  // setting this flag to false since now we assume absence of the user based on threshod crossed.


                                 console.log("User not present after", this.inactivityThreshold / 1000, 'sec of inactivity!');
                              this.handleAbsenceSubmission(); // absence condition so calculate result and send to DB.
                                this.presenceDetectedTime = null; // since it send to server reset the detection timer again to the false state.
                           }
                     } else {
                      this.isUserPresent = false;
                       }
                  console.log('User not present or out of view');
                }
              }
         else{
                console.log('FaceDetection API is not available  cannot test user presence using video  , please use another secure domain.');

             }
           bitmap.close() // free the grabbed bitmap.
             return true;
           }
             catch (error) {
                console.error('Face Detection Error', error);
                  return false;
        }
      },

    async handleAbsenceSubmission() {
      try {
          // check if function calculate results is implemented
           if (typeof window.calculateResult === 'function') {
            console.log("Triggering auto submit function since user not active on video")
                window.calculateResult();
             this.stopMonitoring(); // close all stream of video and audio.

         } else {
                console.error("calculateResult is not a function.");
              this.stopMonitoring();

             }
           } catch (error) {
           console.error("Error occurred on automatic submission for absence detection", error);
         }

   },


    updateMonitoringUI(active) {
        const cameraIcon = document.querySelector('.monitoring-banner i.fa-camera');
        const micIcon = document.querySelector('.monitoring-banner i.fa-microphone');

        if (cameraIcon && micIcon) {
            if (active) {
                cameraIcon.style.color = '#00ff00';
                micIcon.style.color = '#00ff00';
                document.querySelector('.monitoring-banner span:nth-child(1)').textContent = 'Camera Active';
                document.querySelector('.monitoring-banner span:nth-child(2)').textContent = 'Audio Active';
            } else {
                cameraIcon.style.color = '#ff0000';
                micIcon.style.color = '#ff0000';
                document.querySelector('.monitoring-banner span:nth-child(1)').textContent = 'Camera Inactive';
                document.querySelector('.monitoring-banner span:nth-child(2)').textContent = 'Audio Inactive';
            }
        }
    },

    showPermissionError() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2><i class="fas fa-exclamation-triangle" style="color: #ff4444;"></i> Permission Required</h2>
                <p>Camera and microphone access is required to take this test. Please allow access and refresh the page.</p>
                <p style="margin-top: 10px; font-size: 0.9em; color: #666;">If you blocked permissions, please click the camera icon in your browser's address bar to enable them.</p>
                <button onclick="location.reload()" class="submit-btn" style="margin-top: 20px;">
                    Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    },
     stopMonitoring() {
          clearInterval(this.presenceCheckInterval) // removes presence interval.

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
       if (this.videoElement) {
           this.videoElement.remove();
             this.videoElement = null;
        }
       if (this.audioCanvas) {
          this.audioCanvas.remove();
           this.audioCanvas = null;
       }
       if (this.audioContext) {
            this.audioContext.close();
           this.audioContext = null;
       }
      if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
             this.animationFrame = null;
       }
        this.isActive = false;
        this.isUserPresent = false;
         this.updateMonitoringUI(false);
         this.removeSecurityListeners(); // Remove security listeners
      },


    checkAudioLevels() {
        if (!this.stream || !this.analyser) return 0;
       const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
         this.analyser.getByteFrequencyData(dataArray);
       return dataArray.reduce((a, b) => a + b) / dataArray.length;
    },

   handleTabSwitch() {
     this.tabSwitchCount++;
    console.log("Tab switched", this.tabSwitchCount, "times");

         if (this.tabSwitchCount >=3) {
            console.log("Auto submission started since tab switched greater than threshold");
            if (typeof window.calculateResult === 'function') {
                window.calculateResult();
            }
       } else {
            if (this.tabSwitchCount <= 2) {
                 this.showTabSwitchWarningModal();  // pop warning on less than or eqal 2 tabs switches

           }
       }

        // Resume video and audio preview when the user switches back to the tab
        if (document.visibilityState === 'visible' && this.stream) {
            this.videoElement.srcObject = this.stream;
            this.videoElement.play();
            this.visualizeAudio();
        }
     },

    handleVisibilityChange() {
        if (document.visibilityState === 'visible' && this.stream) {
            this.videoElement.srcObject = this.stream;
            this.videoElement.play().catch(err => console.error('Error playing video:', err));
            this.visualizeAudio();
        } else if (document.visibilityState === 'hidden' && this.stream) {
            this.videoElement.pause();
            cancelAnimationFrame(this.animationFrame);
        }
    },

      showTabSwitchWarningModal(){
      if (this.showWarningModal){ // this state value only triggers the function one time.
             return ;
        }
          this.showWarningModal = true;  // making this value as true to avoid poping up each tab switching
      const modal = document.createElement('div');
            modal.className = 'modal warning-modal';
          modal.innerHTML = `
              <div class="modal-content">
                 <h2>Warning</h2>
                  <p>Tab switching is not allowed during the test.</p>
                 <p>Further violations will result in automatic submission.</p>
                  <button class="submit-btn" id="understood-btn">Understood</button>
              </div>
         `;
           document.body.appendChild(modal);
     
      document.getElementById('understood-btn').addEventListener('click', () =>{
             this.removeModal();
         })

    },
     removeModal() {
         const modal = document.querySelector('.modal');
         if (modal) {
           modal.remove();
            }
        },

       resetTabSwitchCount() {
        this.tabSwitchCount = 0;
            this.showWarningModal= false;
    },
  sendReport: async (payload) => {
       try{
           await axios.post(`${config.backendUrl}/api/reports/add-report`,payload );

         }
            catch(error){
             console.log('Error posting the Report', error)
      }
      },

    addSecurityListeners() {
        document.addEventListener('copy', this.preventCopyPaste);
        document.addEventListener('paste', this.preventCopyPaste);
        document.addEventListener('cut', this.preventCopyPaste);
        document.addEventListener('keydown', this.preventInspect);
        document.addEventListener('contextmenu', this.preventContextMenu);
        window.addEventListener('blur', this.handleTabSwitch.bind(this));
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    },

    removeSecurityListeners() {
        document.removeEventListener('copy', this.preventCopyPaste);
        document.removeEventListener('paste', this.preventCopyPaste);
        document.removeEventListener('cut', this.preventCopyPaste);
        document.removeEventListener('keydown', this.preventInspect);
        document.removeEventListener('contextmenu', this.preventContextMenu);
        window.removeEventListener('blur', this.handleTabSwitch.bind(this));
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    },

    preventCopyPaste(e) {
        e.preventDefault();
        message.warning("Copy-paste is not allowed during the exam");
    },

    preventInspect(e) {
        if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && e.keyCode === 73)) {
            e.preventDefault();
            message.warning("Developer tools are not allowed during the exam");
        }
    },

    preventContextMenu(e) {
        e.preventDefault();
        message.warning("Right-click is disabled during the exam");
    },

    enterFullscreen() {
        const element = document.documentElement;
        if (document.fullscreenElement) return;

        if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => console.log(err));
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen().catch(err => console.log(err));
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen().catch(err => console.log(err));
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen().catch(err => console.log(err));
        }
    },

    exitFullscreen() {
        if (!document.fullscreenElement) return;

        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } catch (error) {
            console.log('Error exiting fullscreen:', error);
        }
    },

};

export default MonitoringSystem;