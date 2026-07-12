import { useState, useRef, useCallback, RefObject, useEffect } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Prediction, MAX_FRAMES } from '../types';
import { audioEffects } from '../utils/audioEffects';

interface SmoothedPoint {
  x: number;
  y: number;
  z: number;
}

interface UseHandTrackingOptions {
  onPredict?: (landmarks: number[][]) => Promise<Prediction[]>;
  onRegisterWord?: (word: string) => void;
  isModelLoaded?: boolean;
  backendDelegate?: 'GPU' | 'CPU';
  trackingFps?: number;
  onDwellDelete?: () => void;
  onDwellClear?: () => void;
  onDwellSend?: () => void;
  onDwellSpace?: () => void;
}

export type TrackingStatus = 'idle' | 'starting' | 'tracking' | 'error';

interface UseHandTrackingReturn {
  status: TrackingStatus;
  isTracking: boolean;
  handsDetected: number;
  isRecording: boolean;
  recordingProgress: number;
  predictions: Prediction[];
  startTracking: (deviceId?: string, res?: '480p' | '720p' | '1080p') => Promise<void>;
  stopTracking: () => void;
  startRecording: () => void;
  clearRecording: () => void;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  resolution: '360p' | '480p' | '720p' | '1080p';
  changeResolution: (res: '360p' | '480p' | '720p' | '1080p') => Promise<void>;
  dwellAction: 'Delete' | 'Clear' | 'Send' | 'Space' | null;
  dwellProgress: number;
}


export function useHandTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options?: UseHandTrackingOptions
): UseHandTrackingReturn {
  // Core ML and Stream state
  const streamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number>(0);

  // Tracking synchronization state
  const lastVideoTimeRef = useRef(-1);
  const lastResultsRef = useRef<any>(null);
  const statusRef = useRef<TrackingStatus>('idle');
  const smoothedHandsRef = useRef<SmoothedPoint[][]>([]);
  const lastDetectionTimeRef = useRef<number>(0);
  const currentDelegateRef = useRef<'GPU' | 'CPU'>('GPU');

  // Recording & Prediction state
  const sequenceRef = useRef<number[][]>([]);
  const isRecordingRef = useRef(false);
  const handsDetectedRef = useRef(0);
  const isPredictingRef = useRef(false);
  const frameCountRef = useRef(0);
  const predictionsRef = useRef<Prediction[]>([]);

  // Gesture swipe tracking ref
  const lastSwipeTimeRef = useRef<number>(0);

  // Dwell state variables
  const [dwellAction, setDwellAction] = useState<'Delete' | 'Clear' | 'Send' | 'Space' | null>(null);
  const [dwellProgress, setDwellProgress] = useState<number>(0);

  interface Hotzone {
    name: 'Delete' | 'Clear' | 'Send' | 'Space';
    x: number; // Normalized center X
    y: number; // Normalized center Y
    radius: number; // Normalized radius
    progress: number; // 0 to 100
  }

  const hotzonesRef = useRef<Hotzone[]>([
    { name: 'Delete', x: 0.25, y: 0.15, radius: 0.05, progress: 0 },
    { name: 'Space', x: 0.41, y: 0.15, radius: 0.05, progress: 0 },
    { name: 'Clear', x: 0.59, y: 0.15, radius: 0.05, progress: 0 },
    { name: 'Send', x: 0.75, y: 0.15, radius: 0.05, progress: 0 }
  ]);

  const lastHoveredZoneRef = useRef<'Delete' | 'Clear' | 'Send' | 'Space' | null>(null);
  const hoverStartRef = useRef<number | null>(null);
  const hasTriggeredZoneRef = useRef(false);
  const lastTickRef = useRef<number>(0);
  const lastTriggerTimeRef = useRef<number>(0);
  const lastTriggerTimesRef = useRef<Record<string, number>>({});
  const missingHandFramesRef = useRef<number>(0);


  // Inertial slide & cross-fade physics refs for tracking loss
  const activeHandOpacityRef = useRef<number>(0);
  const prevPointsRef = useRef<SmoothedPoint[][]>([]);
  const velocitiesRef = useRef<SmoothedPoint[][]>([]);

  // React State
  const [status, setStatusState] = useState<TrackingStatus>('idle');
  const [handsDetected, setHandsDetected] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [predictions, setPredictionsState] = useState<Prediction[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [resolution, setResolution] = useState<'360p' | '480p' | '720p' | '1080p'>('360p');

  const selectedDeviceIdRef = useRef(selectedDeviceId);
  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  const resolutionRef = useRef(resolution);
  useEffect(() => {
    resolutionRef.current = resolution;
  }, [resolution]);

  // Helper to sync ref and state for predictions
  const setPredictions = useCallback((newPredictions: Prediction[]) => {
    predictionsRef.current = newPredictions;
    setPredictionsState(newPredictions);
  }, []);

  // Always keep latest options available to callbacks without triggering effect dependencies
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Helper to sync ref and state
  const setStatus = useCallback((newStatus: TrackingStatus) => {
    statusRef.current = newStatus;
    setStatusState(newStatus);
  }, []);

  // Device list updater for hot-swapping
  const updateDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevs);
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
    }
  }, []);

  useEffect(() => {
    updateDevices();
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', updateDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
      };
    }
  }, [updateDevices]);



  // Final cleanup on hook unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (handLandmarkerRef.current) {
        try {
          handLandmarkerRef.current.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const extractLandmarks = useCallback((results: any): number[] => {
    const landmarks: number[] = [];
    if (results?.landmarks) {
      for (const hand of results.landmarks) {
        for (const point of hand) {
          // Mirror the X coordinate (1.0 - x) because the Python code flips the camera frame horizontally
          // before sending it to MediaPipe, whereas JS MediaPipe processes the raw (unflipped) video frame.
          landmarks.push(1.0 - point.x, point.y, point.z);
        }
      }
    }
    while (landmarks.length < 126) {
      landmarks.push(0);
    }
    return landmarks.slice(0, 126);
  }, []);

  const runPrediction = useCallback(async (sequence: number[][]) => {
    if (optionsRef.current?.isModelLoaded && optionsRef.current?.onPredict) {
      try {
        const preds = await optionsRef.current.onPredict(sequence);
        setPredictions(preds);
      } catch (err) {
        console.error('ML prediction failed:', err);
        setPredictions([]);
      }
    } else {
      setPredictions([]);
    }
  }, [setPredictions]);



  const drawHoloHand = useCallback((ctx: CanvasRenderingContext2D, results: any, width: number, height: number) => {
    const hasActiveResults = results?.landmarks && results.landmarks.length > 0;
    if (!hasActiveResults && (smoothedHandsRef.current.length === 0 || activeHandOpacityRef.current <= 0)) return;

    if (hasActiveResults) {
      const currentHands = results.landmarks;

      // Ensure array sizing matches current hand count
      while (smoothedHandsRef.current.length < currentHands.length) {
        smoothedHandsRef.current.push(
          currentHands[smoothedHandsRef.current.length].map((p: any) => ({ x: p.x, y: p.y, z: p.z }))
        );
      }
      smoothedHandsRef.current = smoothedHandsRef.current.slice(0, currentHands.length);

      // Apply smoothing (balanced for high-speed instant response and micro-jitter suppression)
      const smoothingFactor = 0.85;
      currentHands.forEach((hand: any[], handIdx: number) => {
        hand.forEach((point: any, pointIdx: number) => {
          if (smoothedHandsRef.current[handIdx]?.[pointIdx]) {
            smoothedHandsRef.current[handIdx][pointIdx].x = lerp(smoothedHandsRef.current[handIdx][pointIdx].x, point.x, smoothingFactor);
            smoothedHandsRef.current[handIdx][pointIdx].y = lerp(smoothedHandsRef.current[handIdx][pointIdx].y, point.y, smoothingFactor);
            smoothedHandsRef.current[handIdx][pointIdx].z = lerp(smoothedHandsRef.current[handIdx][pointIdx].z || 0, point.z || 0, smoothingFactor);
          }
        });
      });
    }

    // Map connections to finger for coloring
    const fingerBones = [
      { connections: [[0, 1], [1, 2], [2, 3], [3, 4]], finger: 0 },
      { connections: [[0, 5], [5, 6], [6, 7], [7, 8]], finger: 1 },
      { connections: [[0, 9], [9, 10], [10, 11], [11, 12]], finger: 2 },
      { connections: [[0, 13], [13, 14], [14, 15], [15, 16]], finger: 3 },
      { connections: [[0, 17], [17, 18], [18, 19], [19, 20]], finger: 4 },
      { connections: [[5, 9], [9, 13], [13, 17]], finger: -1 },
    ];

    const fingertips = [4, 8, 12, 16, 20];

    ctx.save();
    ctx.globalAlpha = activeHandOpacityRef.current;

    smoothedHandsRef.current.forEach((hand) => {
      const points = hand.map(p => ({ x: p.x * width, y: p.y * height }));

      // === PALM FILL — subtle holographic sheen ===
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      [5, 9, 13, 17, 0].forEach(i => ctx.lineTo(points[i].x, points[i].y));
      ctx.closePath();
      const palmGrad = ctx.createRadialGradient(points[9].x, points[9].y, 0, points[9].x, points[9].y, 60);
      palmGrad.addColorStop(0, 'rgba(0, 120, 212, 0.08)');
      palmGrad.addColorStop(1, 'rgba(0, 120, 212, 0)');
      ctx.fillStyle = palmGrad;
      ctx.fill();

      // Windows 11 setup bloom color palette
      const fingerColors = [
        '#60cdff', // Thumb   — Sky Blue
        '#0078d4', // Index   — Royal Blue
        '#00a2ed', // Middle  — Cyan Blue
        '#5f259f', // Ring    — Violet
        '#7c3aed', // Pinky   — Purple
      ];

      // === BONES — single-pass optimized strokes ===
      fingerBones.forEach(({ connections, finger }) => {
        const color = finger >= 0 ? fingerColors[finger] : '#94a3b8';
        ctx.beginPath();
        connections.forEach(([start, end]) => {
          if (points[start] && points[end]) {
            ctx.moveTo(points[start].x, points[start].y);
            ctx.lineTo(points[end].x, points[end].y);
          }
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // === JOINTS — single-pass optimized dots ===
      hand.forEach((_, idx) => {
        if (!points[idx]) return;
        const x = points[idx].x;
        const y = points[idx].y;
        const isTip = fingertips.includes(idx);

        let fingerIdx = -1;
        if (idx >= 1 && idx <= 4) fingerIdx = 0;
        else if (idx >= 5 && idx <= 8) fingerIdx = 1;
        else if (idx >= 9 && idx <= 12) fingerIdx = 2;
        else if (idx >= 13 && idx <= 16) fingerIdx = 3;
        else if (idx >= 17 && idx <= 20) fingerIdx = 4;

        const color = fingerIdx >= 0 ? fingerColors[fingerIdx] : '#94a3b8';

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (isTip) {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });

      // === FLOATING HUD LABEL FOR PREDICTION ===
      if (predictionsRef.current && predictionsRef.current.length > 0) {
        // Draw normal prediction floating HUD label
        const topPred = predictionsRef.current[0];
        const word = topPred.word.toUpperCase();
        const confidence = Math.round(topPred.confidence * 100);

        // Find hand bounds
        let minY = points[0].y;
        let minX = points[0].x;
        let maxX = points[0].x;
        let topmostPoint = points[0];
        points.forEach(p => {
          if (p.y < minY) {
            minY = p.y;
            topmostPoint = p;
          }
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
        });
        const handCenterX = (minX + maxX) / 2;

        ctx.save();
        ctx.font = 'bold 16px "Outfit", "Inter", sans-serif';
        const textMetrics = ctx.measureText(word);
        const textWidth = textMetrics.width;

        const paddingX = 14;
        const rectW = textWidth + paddingX * 2 + 45; // extra space for confidence
        const rectH = 34;
        const rectY = Math.max(20, minY - 55);

        // Translate to hand horizontal center and start of card
        ctx.translate(handCenterX, rectY);
        // Mirror horizontally so it renders correctly on CSS-mirrored canvas
        ctx.scale(-1, 1);

        // Glassmorphism HUD bg (centered at 0, so from -rectW/2 to rectW/2)
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-rectW / 2, 0, rectW, rectH, 8);
        } else {
          ctx.rect(-rectW / 2, 0, rectW, rectH);
        }
        ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
        ctx.shadowColor = '#0078d4';
        ctx.shadowBlur = 12;
        ctx.fill();

        // Windows 11 Blue border
        ctx.strokeStyle = 'rgba(0, 120, 212, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Dotted leader line
        ctx.beginPath();
        // Starts at bottom-center of the rect (0 in mirrored x, rectH in y)
        ctx.moveTo(0, rectH);
        // Ends at the topmost point of the hand relative to handCenterX, scaled by -1
        ctx.lineTo(-(topmostPoint.x - handCenterX), topmostPoint.y - rectY);
        ctx.strokeStyle = 'rgba(0, 120, 212, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Draw word text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(word, -rectW / 2 + paddingX, 22);

        // Draw confidence badge
        ctx.font = '10px monospace';
        const confColor = confidence > 70 ? '#10b981' : confidence > 40 ? '#f59e0b' : '#f43f5e';
        ctx.fillStyle = confColor;
        ctx.fillText(`${confidence}%`, -rectW / 2 + paddingX + textWidth + 8, 20);

        ctx.restore();
      }
    });

    ctx.restore();
  }, []);

  const stopTracking = useCallback(() => {
    // Prevent duplicate shutdowns
    if (statusRef.current === 'idle') return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear animation state
    smoothedHandsRef.current = [];
    lastVideoTimeRef.current = -1;
    lastResultsRef.current = null;
    activeHandOpacityRef.current = 0;
    prevPointsRef.current = [];
    velocitiesRef.current = [];

    setStatus('idle');
  }, [setStatus]);

  const startTracking = useCallback(async (deviceId?: string, res?: '480p' | '720p' | '1080p') => {
    // Stop current stream if there is one active (hot swap or restart)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      // Allow browser and OS webcam handlers to fully release the device resource to prevent locks/crashes
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }

    setStatus('starting');

    try {
      // 1. Get Camera Stream
      const activeRes = res || resolutionRef.current;
      let width = 1280;
      let height = 720;
      if (activeRes === '1080p') {
        width = 1920;
        height = 1080;
      } else if (activeRes === '480p') {
        width = 640;
        height = 480;
      } else if (activeRes === '360p') {
        width = 640;
        height = 360;
      }

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: width },
        height: { ideal: height }
      };

      const activeId = deviceId || selectedDeviceIdRef.current;
      if (activeId) {
        videoConstraints.deviceId = { exact: activeId };
      } else {
        videoConstraints.facingMode = 'user';
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 2. Initialize MediaPipe via NPM if not already cached (or delegate changed)
      const targetDelegate = optionsRef.current?.backendDelegate || 'GPU';
      if (handLandmarkerRef.current && currentDelegateRef.current !== targetDelegate) {
        console.log(`Closing HandLandmarker to switch delegate from ${currentDelegateRef.current} to ${targetDelegate}`);
        try {
          handLandmarkerRef.current.close();
        } catch (e) { }
        handLandmarkerRef.current = null;
      }

      if (!handLandmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm'
        );

        console.log(`Creating HandLandmarker with ${targetDelegate} delegate`);
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: targetDelegate
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3
        });
        currentDelegateRef.current = targetDelegate;
      }

      // 3. Update device list now that permission is granted (to get friendly labels)
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = allDevices.filter(d => d.kind === 'videoinput');
          setDevices(videoDevs);
          if (activeId) {
            setSelectedDeviceId(activeId);
          } else if (videoDevs.length > 0 && !selectedDeviceIdRef.current) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        }
      } catch (err) {
        console.warn('Error listing devices on track start:', err);
      }

      // 4. Start Processing Loop
      setStatus('tracking');

      const processFrame = () => {
        // Halt if stopped
        if (statusRef.current !== 'tracking') return;

        // Halt if model is not loaded (prevent detection and prediction)
        if (!optionsRef.current?.isModelLoaded) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
          }
          if (predictionsRef.current.length > 0) {
            setPredictions([]);
          }
          if (handsDetectedRef.current !== 0) {
            handsDetectedRef.current = 0;
            setHandsDetected(0);
          }
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }

        if (!videoRef.current || !canvasRef.current) {
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx || video.readyState < 2) {
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const now = performance.now();
        let results = lastResultsRef.current;
        let didProcessNewFrame = false;

        const targetFps = optionsRef.current?.trackingFps || 30;
        const targetInterval = 1000 / targetFps; // e.g., 50ms for 20fps

        if (handLandmarkerRef.current && video.currentTime !== lastVideoTimeRef.current) {
          const elapsed = now - lastDetectionTimeRef.current;
          // Use a small 2ms tolerance threshold to prevent minor scheduler jitter from causing dropped cycles
          if (elapsed >= targetInterval - 2) {
            lastVideoTimeRef.current = video.currentTime;
            lastDetectionTimeRef.current = now;
            results = handLandmarkerRef.current.detectForVideo(video, now);
            lastResultsRef.current = results;
            didProcessNewFrame = true;
          }
        }

        if (didProcessNewFrame) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const currentHandsCount = results?.landmarks?.length || 0;
          if (handsDetectedRef.current !== currentHandsCount) {
            handsDetectedRef.current = currentHandsCount;
            setHandsDetected(currentHandsCount);
          }

          if (currentHandsCount > 0) {
            // Calculate velocities and update prevPoints
            if (velocitiesRef.current.length < smoothedHandsRef.current.length) {
              velocitiesRef.current.push(
                smoothedHandsRef.current[velocitiesRef.current.length].map(() => ({ x: 0, y: 0, z: 0 }))
              );
            }
            velocitiesRef.current = velocitiesRef.current.slice(0, smoothedHandsRef.current.length);

            smoothedHandsRef.current.forEach((hand, handIdx) => {
              hand.forEach((point, pointIdx) => {
                if (!velocitiesRef.current[handIdx]) {
                  velocitiesRef.current[handIdx] = Array(21).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));
                }
                if (prevPointsRef.current?.[handIdx]?.[pointIdx]) {
                  velocitiesRef.current[handIdx][pointIdx] = {
                    x: point.x - prevPointsRef.current[handIdx][pointIdx].x,
                    y: point.y - prevPointsRef.current[handIdx][pointIdx].y,
                    z: point.z - prevPointsRef.current[handIdx][pointIdx].z
                  };
                }
              });
            });

            prevPointsRef.current = smoothedHandsRef.current.map(hand =>
              hand.map(p => ({ x: p.x, y: p.y, z: p.z }))
            );

            // Fade in instantly on hand return
            activeHandOpacityRef.current = 1.0;
          } else {
            // Clear hand tracking skeleton instantly when the actual hand is removed
            activeHandOpacityRef.current = 0;
            smoothedHandsRef.current = [];
            prevPointsRef.current = [];
            velocitiesRef.current = [];
          }

          // Draw HUD skeleton at full animation rate (using cached results when throttled)
          if (currentHandsCount > 0 || activeHandOpacityRef.current > 0) {
            drawHoloHand(ctx, results, canvas.width, canvas.height);
          }

          // === INTERACTIVE HOTZONES DWELL TRACKING ===
          let hoveredZone: any = null;
          if (smoothedHandsRef.current.length > 0) {
            const firstHand = smoothedHandsRef.current[0];
            const indexTip = firstHand[8]; // Index finger tip

            if (indexTip) {
              // Target coordinates visual x is mirrored: 1 - indexTip.x
              const fingerX = 1 - indexTip.x;
              const fingerY = indexTip.y;

              // Find if hovering over any hotzone
              for (const zone of hotzonesRef.current) {
                const dx = fingerX - zone.x;
                const dy = fingerY - zone.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < zone.radius) {
                  hoveredZone = zone;
                  break;
                }
              }
            }
          }

          if (hoveredZone) {
            // Always show visual glow feedback immediately
            setDwellAction(hoveredZone.name);
            setDwellProgress(100);

            if (lastHoveredZoneRef.current !== hoveredZone.name) {
              lastHoveredZoneRef.current = hoveredZone.name;

              // Use per-zone cooldown to prevent double-activations due to hand jitter,
              // while allowing instant activations when switching between different buttons.
              const nowTime = Date.now();
              const lastZoneTrigger = lastTriggerTimesRef.current[hoveredZone.name] || 0;
              if (nowTime - lastZoneTrigger > 300) {
                lastTriggerTimesRef.current[hoveredZone.name] = nowTime;

                if (hoveredZone.name === 'Delete' && options?.onDwellDelete) {
                  options.onDwellDelete();
                } else if (hoveredZone.name === 'Space' && options?.onDwellSpace) {
                  options.onDwellSpace();
                } else if (hoveredZone.name === 'Clear' && options?.onDwellClear) {
                  options.onDwellClear();
                } else if (hoveredZone.name === 'Send' && options?.onDwellSend) {
                  options.onDwellSend();
                }
              }
            }
          } else {
            // No zone hovered, reset hover state
            if (lastHoveredZoneRef.current !== null) {
              lastHoveredZoneRef.current = null;
              setDwellAction(null);
              setDwellProgress(0);
            }
          }

          if (isRecordingRef.current) {
            if (sequenceRef.current.length < MAX_FRAMES) {
              const landmarks = extractLandmarks(results);
              sequenceRef.current.push(landmarks);
              setRecordingProgress(sequenceRef.current.length / MAX_FRAMES);

              if (sequenceRef.current.length >= MAX_FRAMES) {
                isRecordingRef.current = false;
                setIsRecording(false);
                const sequence = [...sequenceRef.current];
                sequenceRef.current = [];
                runPrediction(sequence);
              }
            }
          } else {
            // Auto-prediction mode (runs when hands are detected and not manually recording)
            if (currentHandsCount > 0) {
              missingHandFramesRef.current = 0; // reset grace period counter
              const landmarks = extractLandmarks(results);
              sequenceRef.current.push(landmarks);

              if (sequenceRef.current.length > MAX_FRAMES) {
                sequenceRef.current.shift();
              }

              // Run predictions every 12 actual camera frames (~400ms at 30fps) to prevent ML overload and GPU resource contention
              frameCountRef.current = (frameCountRef.current || 0) + 1;
              if (frameCountRef.current % 12 === 0 && !isPredictingRef.current) {
                const sequenceCopy = [...sequenceRef.current];
                isPredictingRef.current = true;

                runPrediction(sequenceCopy).finally(() => {
                  isPredictingRef.current = false;
                });
              }
            } else if (currentHandsCount === 0) {
              // Grace period: only clear sequence memory if tracking is lost continuously for 4 frames (~133ms)
              missingHandFramesRef.current += 1;
              if (missingHandFramesRef.current > 4 && sequenceRef.current.length > 0) {
                sequenceRef.current = [];
              }
            }
          }
        }

        animationRef.current = requestAnimationFrame(processFrame);
      };

      animationRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('Failed to start tracking:', error);
      setStatus('error');
      // Attempt cleanup on failure
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [videoRef, canvasRef, drawHoloHand, extractLandmarks, runPrediction, setStatus]);

  const startRecording = useCallback(() => {
    sequenceRef.current = [];
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingProgress(0);
    setPredictions([]);
  }, []);

  const clearRecording = useCallback(() => {
    sequenceRef.current = [];
    isRecordingRef.current = false;
    setIsRecording(false);
    setRecordingProgress(0);
    setPredictions([]);
  }, []);

  const changeResolution = useCallback(async (newRes: '360p' | '480p' | '720p' | '1080p') => {
    setResolution(newRes);
    if (statusRef.current === 'tracking' || statusRef.current === 'starting') {
      await startTracking(selectedDeviceIdRef.current, newRes);
    }
  }, [startTracking]);

  // Re-initialize tracking if backendDelegate option changes dynamically while tracking
  useEffect(() => {
    const targetDelegate = options?.backendDelegate || 'GPU';
    if (statusRef.current === 'tracking' && currentDelegateRef.current !== targetDelegate) {
      console.log(`🔄 Dynamic backendDelegate swap to: ${targetDelegate}`);
      startTracking(selectedDeviceIdRef.current, resolutionRef.current);
    }
  }, [options?.backendDelegate, startTracking]);

  return {
    status,
    isTracking: status === 'tracking',
    handsDetected,
    isRecording,
    recordingProgress,
    predictions,
    startTracking,
    stopTracking,
    startRecording,
    clearRecording,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    resolution,
    changeResolution,
    dwellAction,
    dwellProgress
  };
}
