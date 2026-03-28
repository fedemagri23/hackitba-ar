'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CampaignConfig } from '@/lib/ar/tracking-types';
import { createLandmarker } from '@/lib/ar/mediapipe-loader';
import { FaceMask } from '@/lib/ar/masks/FaceMask';
import { PoseMask } from '@/lib/ar/masks/PoseMask';
import { HandMask } from '@/lib/ar/masks/HandMask';

interface ARCanvasProps {
  config: CampaignConfig;
}

type RecordingState = 'idle' | 'recording' | 'reviewing';

export default function ARCanvas({ config }: ARCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<VideoFacingModeEnum>('user');
  const [canFlip, setCanFlip] = useState(false);

  // Recording State
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateCameraCount = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setCanFlip(videoInputs.length > 1 || isMobile);
    } catch (e) {
      console.warn('Could not enumerate cameras', e);
    }
  };

  useEffect(() => {
    updateCameraCount();
  }, []);

  useEffect(() => {
    let animId: number;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let landmarker: any;
    let mask: any;
    let isActive = true;
    let currentStream: MediaStream | null = null;
    
    // Background Video Texture entities
    let bgMesh: THREE.Mesh;
    let videoTexture: THREE.VideoTexture;

    const FOV = 35;
    const DISTANCE = 1 / Math.tan((FOV / 2) * Math.PI / 180);

    async function init() {
      if (recordingState === 'reviewing') return;
      setIsLoading(true);
      
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode, 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
        
        if (!videoRef.current || !isActive) {
          currentStream.getTracks().forEach(t => t.stop());
          return;
        }

        videoRef.current.srcObject = currentStream;
        
        try {
          await videoRef.current.play();
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          throw err;
        }

        updateCameraCount();

        const { videoWidth, videoHeight } = videoRef.current;
        const videoAspect = videoWidth / videoHeight;

        // --- Three.js Setup ---
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000);
        camera.position.z = DISTANCE;

        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current!,
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true // Required for canvas capture
        });
        renderer.setPixelRatio(window.devicePixelRatio);

        // --- Background Video Setup ---
        videoTexture = new THREE.VideoTexture(videoRef.current);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        
        const bgGeo = new THREE.PlaneGeometry(2, 2);
        const bgMat = new THREE.MeshBasicMaterial({ map: videoTexture });
        bgMesh = new THREE.Mesh(bgGeo, bgMat);
        // Place background at z=0 (landmarks plane)
        bgMesh.position.z = 0; 
        scene.add(bgMesh);

        const handleResize = () => {
          if (!containerRef.current || !renderer || !camera) return;
          const { clientWidth, clientHeight } = containerRef.current;
          const containerAspect = clientWidth / clientHeight;

          renderer.setSize(clientWidth, clientHeight);
          camera.aspect = containerAspect;
          camera.updateProjectionMatrix();

          // Calculate "Cover" scaling for background plane
          // The background plane is at DISTANCE units away from the camera's eye at z=0
          // At z=0, the height of the view is 2.0 units
          // The width of the view is 2.0 * camera.aspect
          
          let planeScaleW = 2 * camera.aspect;
          let planeScaleH = 2;

          // Align background aspect to video aspect while covering the viewport
          if (containerAspect > videoAspect) {
            // Container is wider than video aspect: scale by width
            planeScaleH = planeScaleW / videoAspect;
          } else {
            // Container is narrower than video aspect: scale by height
            planeScaleW = planeScaleH * videoAspect;
          }

          bgMesh.scale.set(planeScaleW / 2, planeScaleH / 2, 1);
          
          // Mirroring if user camera
          if (facingMode === 'user') {
            bgMesh.scale.x *= -1;
          }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // --- Mask Setup ---
        if (config.trackingMode === 'face') mask = new FaceMask();
        else if (config.trackingMode === 'pose') mask = new PoseMask();
        else mask = new HandMask();

        scene.add(mask.group);
        if (config.brandObjects) config.brandObjects(mask.group);

        // --- MediaPipe Setup ---
        landmarker = await createLandmarker(config.trackingMode);
        setIsLoading(false);

        // --- Animation Loop ---
        const isMirrored = facingMode === 'user';
        const render = () => {
          if (!isActive) return;
          if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
            const startTimeMs = performance.now();
            const results = landmarker.detectForVideo(videoRef.current, startTimeMs);

            if (results.faceLandmarks?.[0]) mask.update(results.faceLandmarks[0], videoAspect, 2, isMirrored);
            if (results.landmarks?.[0]) mask.update(results.landmarks[0], videoAspect, 2, isMirrored);

            renderer.render(scene, camera);
          }
          animId = requestAnimationFrame(render);
        };
        render();

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error init AR');
      }
    }

    init();

    return () => {
      isActive = false;
      window.removeEventListener('resize', () => {}); 
      cancelAnimationFrame(animId);
      if (renderer) renderer.dispose();
      if (currentStream) currentStream.getTracks().forEach(t => t.stop());
    };
  }, [config, facingMode, recordingState]);

  // --- Recording Logic ---
  const startRecording = useCallback(() => {
    if (!canvasRef.current || recordingState !== 'idle') return;

    setRecordingState('recording');
    setRecordProgress(0);
    chunksRef.current = [];

    const stream = canvasRef.current.captureStream(30);
    const options = { mimeType: 'video/webm;codecs=vp9' };
    
    try {
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setRecordingState('reviewing');
      };

      recorder.start();

      // progress timer
      const duration = 15000;
      const step = 100;
      let elapsed = 0;

      progressIntervalRef.current = setInterval(() => {
        elapsed += step;
        setRecordProgress((elapsed / duration) * 100);
      }, step);

      recordTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, duration);

    } catch (e) {
      console.error('Recorder initialization failed', e);
      setRecordingState('idle');
    }
  }, [recordingState]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordingState('idle');
    setRecordProgress(0);
  };

  const isMirrored = facingMode === 'user';

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center font-sans tracking-tight">
      {/* Background Scanning UI */}
      {isLoading && recordingState !== 'reviewing' && !error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black gap-6">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-black uppercase tracking-[0.4em] animate-pulse">Iniciando IA...</div>
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-8 text-center gap-4">
          <p className="text-red-500 font-bold uppercase tracking-widest text-sm">Error fatal</p>
          <p className="text-xl max-w-md opacity-60 font-light">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-4 bg-white text-black font-black uppercase tracking-widest hover:invert active:scale-95 transition-all text-sm"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Main Capture Element */}
          <canvas
            ref={canvasRef}
            className={`w-full h-full object-cover transition-opacity duration-700 ${recordingState === 'reviewing' ? 'opacity-0' : 'opacity-100'}`}
          />
          
          {/* Invisible Source */}
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            muted
          />
          
          {/* AR HUD - Only visible during active AR */}
          {recordingState !== 'reviewing' && (
            <div className={`absolute inset-0 pointer-events-none z-10 border-[10px] md:border-[30px] border-black/20 transition-opacity ${recordingState === 'recording' ? 'opacity-40' : 'opacity-100'}`}>
              <div className="absolute top-8 left-8 flex flex-col items-start gap-1">
                <span className="bg-white text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter">Live AR</span>
                <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg">
                  {config.brand} {config.challengeTitle}
                </h3>
              </div>
            </div>
          )}

          {/* AR Controls Bar */}
          {recordingState !== 'reviewing' && (
            <div className="absolute bottom-12 left-0 right-0 z-40 flex items-center justify-center gap-8 px-8 pointer-events-none">
              <div className="flex-1 flex justify-end">
                {canFlip && recordingState === 'idle' && (
                  <button
                    onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                    className="pointer-events-auto p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/20 hover:bg-white text-white hover:text-black transition-all active:scale-90"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Record Button */}
              <button
                onClick={recordingState === 'idle' ? startRecording : stopRecording}
                className="pointer-events-auto group relative flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95">
                  <div className={`
                    rounded-full transition-all duration-300
                    ${recordingState === 'recording' ? 'w-8 h-8 bg-red-600 rounded-sm' : 'w-16 h-16 bg-red-600'}
                  `} />
                </div>
                
                {/* SVG Ring Progress */}
                {recordingState === 'recording' && (
                  <svg className="absolute w-24 h-24 -rotate-90">
                    <circle
                      cx="48" cy="48" r="44"
                      stroke="white" strokeWidth="4"
                      fill="transparent"
                      strokeDasharray="276"
                      strokeDashoffset={276 - (276 * recordProgress) / 100}
                      className="transition-all duration-100 ease-linear"
                    />
                  </svg>
                )}
              </button>

              <div className="flex-1 flex flex-col items-start gap-1">
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40 text-white">Tracking</span>
                <span className="text-xs md:text-sm text-white font-black uppercase border-b-2 border-white pb-1">{config.trackingMode} Active</span>
              </div>
            </div>
          )}

          {/* Review Overlay */}
          {recordingState === 'reviewing' && recordedUrl && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black animate-in fade-in duration-500">
              <video
                src={recordedUrl}
                autoPlay loop playsInline
                className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
              />
              
              {/* Review HUD */}
              <div className="absolute top-12 left-12 flex flex-col items-start gap-1">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest animate-pulse">REPLAY</span>
              </div>

              {/* Review Actions */}
              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-6 px-12">
                <button
                  onClick={discardRecording}
                  className="flex-1 py-5 px-8 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95"
                >
                  Eliminar
                </button>
                <button
                  className="flex-3 py-5 px-12 bg-white text-black font-extrabold uppercase tracking-[0.3em] text-sm hover:invert transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Enviar
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Recording Timer Label */}
          {recordingState === 'recording' && (
            <div className="absolute top-12 left-0 right-0 flex justify-center z-50">
              <span className="bg-red-600 px-4 py-1.5 text-xs font-black uppercase tracking-[0.3em] text-white animate-pulse">
                Recording {Math.floor(recordProgress * 0.15)}s
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
