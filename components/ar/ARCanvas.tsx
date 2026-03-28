'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CampaignConfig } from '@/lib/ar/tracking-types';
import { createLandmarker } from '@/lib/ar/mediapipe-loader';
import { FaceMask } from '@/lib/ar/masks/FaceMask';
import { PoseMask } from '@/lib/ar/masks/PoseMask';
import { HandMask } from '@/lib/ar/masks/HandMask';

interface ARCanvasProps {
  config: CampaignConfig;
}

export default function ARCanvas({ config }: ARCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let landmarker: any;
    let mask: any;
    let isActive = true;

    // Camera settings
    const FOV = 35;
    const DISTANCE = 1 / Math.tan((FOV / 2) * Math.PI / 180);

    async function init() {
      try {
        // 1. Setup Camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
        
        if (!videoRef.current || !isActive) return;
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('Video play interrupted (AbortError), ignoring.');
          } else {
            throw err;
          }
        }

        if (!isActive) return;

        const { videoWidth, videoHeight } = videoRef.current;
        const videoAspect = videoWidth / videoHeight;

        // 2. Setup Three.js
        scene = new THREE.Scene();
        
        // Perspective camera with low FOV
        camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000);
        camera.position.z = DISTANCE;

        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current!,
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true
        });
        
        // Handle initial size and resize
        const handleResize = () => {
          if (!containerRef.current || !renderer || !camera) return;
          const { clientWidth, clientHeight } = containerRef.current;
          
          renderer.setSize(clientWidth, clientHeight);
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // 3. Setup Mask & Brand Objects
        if (config.trackingMode === 'face') mask = new FaceMask();
        else if (config.trackingMode === 'pose') mask = new PoseMask();
        else mask = new HandMask();

        scene.add(mask.group);

        if (config.brandObjects) {
          config.brandObjects(mask.group);
        }

        // 4. Setup MediaPipe
        landmarker = await createLandmarker(config.trackingMode);
        
        setIsLoading(false);

        // 5. Animation Loop
        const render = () => {
          if (!isActive) return;
          
          if (videoRef.current && videoRef.current.readyState >= 2) {
            const startTimeMs = performance.now();
            const results = landmarker.detectForVideo(videoRef.current, startTimeMs);

            // Update mask with video's raw aspect
            if (config.trackingMode === 'face' && results.faceLandmarks?.[0]) {
              mask.update(results.faceLandmarks[0], videoAspect);
            } else if (config.trackingMode === 'pose' && results.landmarks?.[0]) {
              mask.update(results.landmarks[0], videoAspect);
            } else if (config.trackingMode === 'hand' && results.landmarks?.[0]) {
              mask.update(results.landmarks[0], videoAspect);
            }

            renderer.render(scene, camera);
          }
          
          animId = requestAnimationFrame(render);
        };

        render();

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error initializing AR');
      }
    }

    init();

    return () => {
      isActive = false;
      window.removeEventListener('resize', () => {}); // cleanup
      cancelAnimationFrame(animId);
      if (renderer) renderer.dispose();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [config]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Background Scanning UI */}
      {isLoading && (
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
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
          />
          
          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 border-[10px] md:border-[30px] border-black/20">
            <div className="absolute top-8 left-8 flex flex-col items-start gap-1">
              <span className="bg-white text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter">Live AR</span>
              <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg">
                {config.brand} {config.challengeTitle}
              </h3>
            </div>
            
            <div className="absolute bottom-12 right-8 flex flex-col items-end gap-1 text-right">
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Tracking</span>
              <span className="text-xs md:text-sm font-black uppercase border-b-2 border-white pb-1">{config.trackingMode} Active</span>
            </div>

            {/* Viewfinder crosshairs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 opacity-30">
              <div className="absolute top-0 left-0 w-3 h-0.5 bg-white" />
              <div className="absolute top-0 left-0 w-0.5 h-3 bg-white" />
              <div className="absolute top-0 right-0 w-3 h-0.5 bg-white" />
              <div className="absolute top-0 right-0 w-0.5 h-3 bg-white" />
              <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white" />
              <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white" />
              <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white" />
              <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
