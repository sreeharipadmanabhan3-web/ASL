import React, { useState, useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister: (username: string, email: string, password: string, displayName?: string) => Promise<boolean>;
  onGuestLogin: () => Promise<boolean>;
  isLoading: boolean;
  error: string;
}

type AuthMode = 'login' | 'register';
type SkeletonStyle = 'neon' | 'mesh' | 'hud' | 'literal';

// Define joint connections for the skeleton
const fingerBones = [
  { connections: [[0, 1], [1, 2], [2, 3], [3, 4]], color: '#f59e0b', glow: 'rgba(245, 158, 11,' }, // Thumb
  { connections: [[0, 5], [5, 6], [6, 7], [7, 8]], color: '#06b6d4', glow: 'rgba(6, 182, 212,' },  // Index
  { connections: [[0, 9], [9, 10], [10, 11], [11, 12]], color: '#10b981', glow: 'rgba(16, 185, 129,' }, // Middle
  { connections: [[0, 13], [13, 14], [14, 15], [15, 16]], color: '#8b5cf6', glow: 'rgba(139, 92, 246,' }, // Ring
  { connections: [[0, 17], [17, 18], [18, 19], [19, 20]], color: '#f43f5e', glow: 'rgba(244, 63, 94,' },  // Pinky
  { connections: [[5, 9], [9, 13], [13, 17]], color: '#94a3b8', glow: 'rgba(148, 163, 184,' } // Palm base connection
];

export function LoginScreen({
  onLogin,
  onRegister,
  onGuestLogin,
  isLoading,
  error
}: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Active hand skeleton drawing style state
  const [skeletonStyle, setSkeletonStyle] = useState<SkeletonStyle>('hud');

  // Background camera & landmarker tracking state
  const [isCameraTesting, setIsCameraTesting] = useState(false);

  // Background camera & landmarker tracking refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number>(0);

  // Inertial slide & cross-fade physics refs for tracking loss
  const activeHandOpacityRef = useRef<number>(0);
  const simulatedHandOpacityRef = useRef<number>(1);
  const prevPointsRef = useRef<{ x: number; y: number }[] | null>(null);
  const velocitiesRef = useRef<{ x: number; y: number }[]>(
    Array(21).fill(null).map(() => ({ x: 0, y: 0 }))
  );

  // Sync active skeleton style to ref for the frame loop
  const styleRef = useRef(skeletonStyle);
  useEffect(() => {
    styleRef.current = skeletonStyle;
  }, [skeletonStyle]);

  // Background Camera Stream & MediaPipe Lifecycle
  useEffect(() => {
    if (!isCameraTesting) return;

    let active = true;

    async function initTracking() {
      try {
        // 1. Get webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // 2. Load MediaPipe Hand Landmarker
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm'
        );

        if (!active) return;

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });
      } catch (err) {
        console.warn('Background hand tracking on login could not start (likely no camera or blocked):', err);
      }
    }

    initTracking();

    // 3. Draw Loop
    let lastTime = -1;
    let results: any = null;

    const renderLoop = () => {
      if (!active) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) {
        animationRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Handle MediaPipe detections if available
      if (handLandmarkerRef.current && video && video.readyState >= 2) {
        if (video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          try {
            results = handLandmarkerRef.current.detectForVideo(video, performance.now());
          } catch (e) {
            // ignore detect errors
          }
        }
      }

      const hasHand = results?.landmarks && results.landmarks.length > 0;

      if (hasHand) {
        const detectedHand = results.landmarks[0];
        const points = detectedHand.map((pt: any) => ({
          x: 1 - pt.x,
          y: pt.y
        }));

        // Initialize or update velocities
        if (!prevPointsRef.current) {
          prevPointsRef.current = points;
          velocitiesRef.current = Array(21).fill(null).map(() => ({ x: 0, y: 0 }));
        } else {
          for (let i = 0; i < 21; i++) {
            if (points[i] && prevPointsRef.current[i]) {
              velocitiesRef.current[i] = {
                x: points[i].x - prevPointsRef.current[i].x,
                y: points[i].y - prevPointsRef.current[i].y
              };
            }
          }
          prevPointsRef.current = points;
        }

        // Fade in active hand, fade out simulated hand
        activeHandOpacityRef.current = Math.min(1.0, activeHandOpacityRef.current + 0.08);
        simulatedHandOpacityRef.current = Math.max(0.0, simulatedHandOpacityRef.current - 0.08);
      } else {
        // Hand lost! Drift points by velocity and apply friction
        if (prevPointsRef.current) {
          for (let i = 0; i < 21; i++) {
            if (prevPointsRef.current[i] && velocitiesRef.current[i]) {
              prevPointsRef.current[i].x += velocitiesRef.current[i].x;
              prevPointsRef.current[i].y += velocitiesRef.current[i].y;
              velocitiesRef.current[i].x *= 0.90;
              velocitiesRef.current[i].y *= 0.90;
            }
          }
        }

        // Fade out active hand, fade in simulated hand
        activeHandOpacityRef.current = Math.max(0.0, activeHandOpacityRef.current - 0.04);
        simulatedHandOpacityRef.current = Math.min(1.0, simulatedHandOpacityRef.current + 0.04);

        if (activeHandOpacityRef.current === 0) {
          // Clear velocities & points when fully faded
          prevPointsRef.current = null;
        }
      }

      // Draw hands
      ctx.clearRect(0, 0, width, height);

      // 1. Draw active hand if visible
      if (activeHandOpacityRef.current > 0 && prevPointsRef.current) {
        ctx.save();
        ctx.globalAlpha = activeHandOpacityRef.current;
        drawHandOnCanvas(ctx, prevPointsRef.current, width, height, styleRef.current);
        ctx.restore();
      }

      // 2. Draw simulated hand if visible
      if (simulatedHandOpacityRef.current > 0) {
        ctx.save();
        ctx.globalAlpha = simulatedHandOpacityRef.current;
        const time = performance.now() * 0.0015;
        const fallbackPoints = getSimulatedHand(time);
        drawHandOnCanvas(ctx, fallbackPoints, width, height, styleRef.current);
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
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
  }, [isCameraTesting]);

  // Helper to draw the hand on canvas with multiple styles
  const drawHandOnCanvas = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    width: number,
    height: number,
    style: SkeletonStyle
  ) => {
    ctx.save();

    if (style === 'literal') {
      const pxPoints = points.map(p => ({ x: p.x * width, y: p.y * height }));

      // Global pinky-pointing vector (from index knuckle to pinky knuckle)
      const vP = {
        x: pxPoints[17].x - pxPoints[5].x,
        y: pxPoints[17].y - pxPoints[5].y
      };
      const vPLen = Math.sqrt(vP.x * vP.x + vP.y * vP.y);
      const vPx = vP.x / (vPLen || 1);
      const vPy = vP.y / (vPLen || 1);

      // Wrist points offset to give the base of the hand realistic thickness
      const wristThumb = {
        x: pxPoints[0].x - vPx * 34,
        y: pxPoints[0].y - vPy * 34
      };
      const wristPinky = {
        x: pxPoints[0].x + vPx * 34,
        y: pxPoints[0].y + vPy * 34
      };

      // Helper to compute finger sides offset perpendicular to bone segments
      const getFingerSides = (indices: number[], baseW: number, tipW: number) => {
        const thumbSide: { x: number; y: number }[] = [];
        const pinkySide: { x: number; y: number }[] = [];

        for (let i = 0; i < indices.length; i++) {
          const currIdx = indices[i];
          const curr = pxPoints[currIdx];

          let dx = 0;
          let dy = 0;

          if (i === 0) {
            const next = pxPoints[indices[1]];
            dx = next.x - curr.x;
            dy = next.y - curr.y;
          } else if (i === indices.length - 1) {
            const prev = pxPoints[indices[i - 1]];
            dx = curr.x - prev.x;
            dy = curr.y - prev.y;
          } else {
            const prev = pxPoints[indices[i - 1]];
            const next = pxPoints[indices[i + 1]];
            dx = next.x - prev.x;
            dy = next.y - prev.y;
          }

          const len = Math.sqrt(dx * dx + dy * dy);
          let nx = 0;
          let ny = -1;
          if (len > 0.001) {
            nx = -dy / len;
            ny = dx / len;
          }

          const t = i / (indices.length - 1 || 1);
          const halfWidth = baseW - t * (baseW - tipW);

          // Dot product with pinky-pointing vector to classify side orientations
          const dot = nx * vP.x + ny * vP.y;
          if (dot > 0) {
            // +N is pinky-facing side, -N is thumb-facing side
            thumbSide.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
            pinkySide.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
          } else {
            // +N is thumb-facing side, -N is pinky-facing side
            thumbSide.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
            pinkySide.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
          }
        }

        return { thumbSide, pinkySide };
      };

      const thumb = getFingerSides([1, 2, 3, 4], 20, 13);
      const index = getFingerSides([5, 6, 7, 8], 15, 10.5);
      const middle = getFingerSides([9, 10, 11, 12], 15, 10.5);
      const ring = getFingerSides([13, 14, 15, 16], 14, 10);
      const pinky = getFingerSides([17, 18, 19, 20], 12.5, 9);

      // Build the outer hand envelope path
      ctx.beginPath();
      ctx.moveTo(wristThumb.x, wristThumb.y);

      // 1. Thumb outer to inner
      thumb.thumbSide.forEach(p => ctx.lineTo(p.x, p.y));
      for (let i = thumb.pinkySide.length - 1; i >= 0; i--) {
        ctx.lineTo(thumb.pinkySide[i].x, thumb.pinkySide[i].y);
      }

      // 2. Index outer to inner
      index.thumbSide.forEach(p => ctx.lineTo(p.x, p.y));
      for (let i = index.pinkySide.length - 1; i >= 0; i--) {
        ctx.lineTo(index.pinkySide[i].x, index.pinkySide[i].y);
      }

      // 3. Middle outer to inner
      middle.thumbSide.forEach(p => ctx.lineTo(p.x, p.y));
      for (let i = middle.pinkySide.length - 1; i >= 0; i--) {
        ctx.lineTo(middle.pinkySide[i].x, middle.pinkySide[i].y);
      }

      // 4. Ring outer to inner
      ring.thumbSide.forEach(p => ctx.lineTo(p.x, p.y));
      for (let i = ring.pinkySide.length - 1; i >= 0; i--) {
        ctx.lineTo(ring.pinkySide[i].x, ring.pinkySide[i].y);
      }

      // 5. Pinky outer to inner
      pinky.thumbSide.forEach(p => ctx.lineTo(p.x, p.y));
      for (let i = pinky.pinkySide.length - 1; i >= 0; i--) {
        ctx.lineTo(pinky.pinkySide[i].x, pinky.pinkySide[i].y);
      }

      // 6. Connect to wrist pinky side and close path
      ctx.lineTo(wristPinky.x, wristPinky.y);
      ctx.closePath();

      // Soft solid gradient fill of the hand shape
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.22)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw a neat glowing border outline
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Soft interior bones
      fingerBones.forEach(({ connections }) => {
        connections.forEach(([start, end]) => {
          const p1 = pxPoints[start];
          const p2 = pxPoints[end];
          if (!p1 || !p2) return;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });

      ctx.restore();
      return;
    }

    if (style === 'mesh') {
      // 1. Palm solid polygon mesh (low opacity glow base)
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      [5, 9, 13, 17, 0].forEach(idx => {
        ctx.lineTo(points[idx].x * width, points[idx].y * height);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.03)';
      ctx.fill();

      // 2. Knuckle-to-Knuckle structural lines (knuckle arch)
      ctx.beginPath();
      ctx.moveTo(points[5].x * width, points[5].y * height);
      ctx.lineTo(points[9].x * width, points[9].y * height);
      ctx.lineTo(points[13].x * width, points[13].y * height);
      ctx.lineTo(points[17].x * width, points[17].y * height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3. Fingertip bounds tracking sweep paths (connecting fingertips 4 -> 8 -> 12 -> 16 -> 20)
      ctx.beginPath();
      ctx.moveTo(points[4].x * width, points[4].y * height);
      ctx.lineTo(points[8].x * width, points[8].y * height);
      ctx.lineTo(points[12].x * width, points[12].y * height);
      ctx.lineTo(points[16].x * width, points[16].y * height);
      ctx.lineTo(points[20].x * width, points[20].y * height);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Subtle finger root webbing triangles
      const drawWeb = (p1Idx: number, p2Idx: number, p3Idx: number, fillColor: string) => {
        ctx.beginPath();
        ctx.moveTo(points[p1Idx].x * width, points[p1Idx].y * height);
        ctx.lineTo(points[p2Idx].x * width, points[p2Idx].y * height);
        ctx.lineTo(points[p3Idx].x * width, points[p3Idx].y * height);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
      };
      drawWeb(0, 1, 5, 'rgba(245, 158, 11, 0.02)');
      drawWeb(5, 6, 9, 'rgba(6, 182, 212, 0.02)');
      drawWeb(9, 10, 13, 'rgba(16, 185, 129, 0.02)');
      drawWeb(13, 14, 17, 'rgba(139, 92, 246, 0.02)');
    }

    // 5. Draw wrist connections
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    ctx.lineTo(points[1].x * width, points[1].y * height);
    ctx.moveTo(points[0].x * width, points[0].y * height);
    ctx.lineTo(points[5].x * width, points[5].y * height);
    ctx.moveTo(points[0].x * width, points[0].y * height);
    ctx.lineTo(points[17].x * width, points[17].y * height);
    if (style === 'neon') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.2;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 3]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Draw bones
    fingerBones.forEach(({ connections, color, glow }) => {
      connections.forEach(([start, end]) => {
        const p1 = points[start];
        const p2 = points[end];
        if (!p1 || !p2) return;

        const x1 = p1.x * width;
        const y1 = p1.y * height;
        const x2 = p2.x * width;
        const y2 = p2.y * height;

        if (style === 'hud') {
          // HUD Style: Dashed bones, no glow
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Neon & Mesh Styles: Glowing links
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `${glow}0.1)`;
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `${glow}0.25)`;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      });
    });

    // 7. HUD Specific rotating radar overlays
    if (style === 'hud') {
      const t = performance.now() * 0.0018;

      // Wrist target circle
      const wx = points[0].x * width;
      const wy = points[0].y * height;
      ctx.beginPath();
      ctx.arc(wx, wy, 15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 4]);
      ctx.stroke();

      // Palm center target circle (J9)
      const px = points[9].x * width;
      const py = points[9].y * height;
      ctx.beginPath();
      ctx.arc(px, py, 22, t, t + Math.PI * 1.5);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 8. Draw joint nodes
    points.forEach((p, idx) => {
      const x = p.x * width;
      const y = p.y * height;
      const isTip = [4, 8, 12, 16, 20].includes(idx);

      let color = '#94a3b8';
      let glow = 'rgba(148, 163, 184,';
      if (idx >= 1 && idx <= 4) { color = '#f59e0b'; glow = 'rgba(245, 158, 11,'; }
      else if (idx >= 5 && idx <= 8) { color = '#06b6d4'; glow = 'rgba(6, 182, 212,'; }
      else if (idx >= 9 && idx <= 12) { color = '#10b981'; glow = 'rgba(16, 185, 129,'; }
      else if (idx >= 13 && idx <= 16) { color = '#8b5cf6'; glow = 'rgba(139, 92, 246,'; }
      else if (idx >= 17 && idx <= 20) { color = '#f43f5e'; glow = 'rgba(244, 63, 94,'; }

      if (style === 'hud') {
        // HUD Crosshairs
        ctx.beginPath();
        ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.font = '6px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillText(`J${idx.toString().padStart(2, '0')}`, x + 6, y + 2);
      } else if (style === 'mesh') {
        // Mesh Concentric Rings
        ctx.beginPath();
        ctx.arc(x, y, isTip ? 7 : 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 2.5 : 1.2, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? '#fff' : color;
        ctx.fill();
      } else {
        // Cyber Neon Glowing Rings
        ctx.beginPath();
        ctx.arc(x, y, isTip ? 8 : 4, 0, Math.PI * 2);
        ctx.fillStyle = `${glow}0.25)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 3 : 1.8, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? '#fff' : color;
        ctx.fill();
      }
    });

    ctx.restore();
  };

  // Helper to generate simulated default waving hand joints
  const getSimulatedHand = (t: number) => {
    const points: { x: number; y: number }[] = [];

    // Wrist base
    points.push({ x: 0.5, y: 0.85 });

    // Thumb
    points.push({ x: 0.43, y: 0.74 });
    points.push({ x: 0.34, y: 0.67 });
    points.push({ x: 0.27, y: 0.63 });
    points.push({ x: 0.21, y: 0.61 + Math.sin(t * 1.5) * 0.02 });

    // Index
    points.push({ x: 0.44, y: 0.55 });
    points.push({ x: 0.38, y: 0.43 });
    points.push({ x: 0.34, y: 0.33 });
    points.push({ x: 0.30, y: 0.23 + Math.sin(t * 2) * 0.03 });

    // Middle
    points.push({ x: 0.5, y: 0.50 });
    points.push({ x: 0.5, y: 0.35 });
    points.push({ x: 0.5, y: 0.23 });
    points.push({ x: 0.5, y: 0.11 + Math.sin(t * 2 + 0.5) * 0.035 });

    // Ring
    points.push({ x: 0.56, y: 0.54 });
    points.push({ x: 0.60, y: 0.39 });
    points.push({ x: 0.64, y: 0.27 });
    points.push({ x: 0.68, y: 0.17 + Math.sin(t * 2 + 1.0) * 0.035 });

    // Pinky
    points.push({ x: 0.62, y: 0.60 });
    points.push({ x: 0.70, y: 0.51 });
    points.push({ x: 0.76, y: 0.43 });
    points.push({ x: 0.82, y: 0.35 + Math.sin(t * 2 + 1.5) * 0.03 });

    return points;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!username.trim()) {
      setLocalError('Username is required');
      return;
    }

    if (mode === 'register' && !email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    if (mode === 'register' && password.length < 4) {
      setLocalError('Password must be at least 4 characters');
      return;
    }

    if (mode === 'login') {
      await onLogin(username, password);
    } else {
      await onRegister(username, email, password, displayName || undefined);
    }
  };

  const handleGuestLogin = async () => {
    setLocalError('');
    await onGuestLogin();
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 animate-bg-fluid flex items-center justify-center p-4 sm:p-6 md:p-8 select-none overflow-hidden">

      {/* Background ambient animations and tech elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-emerald-500/[0.02] animate-pulse-glow pointer-events-none" />

      {/* Ambient glass glows */}
      <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] max-w-[400px] rounded-full bg-emerald-500/5 blur-[120px] animate-orb-color-1 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] max-w-[350px] rounded-full bg-teal-500/5 blur-[100px] animate-orb-color-2 pointer-events-none" />

      {/* Subtle alignment lasers */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-teal-500/5 to-transparent pointer-events-none" />

      {/* Center-aligned dual-pane glassmorphic card */}
      <div className="relative w-full max-w-4xl min-h-[620px] md:min-h-[660px] glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 animate-scale-in">

        {/* LEFT COLUMN: Auth Form */}
        <div className="w-full md:w-7/12 flex flex-col justify-center py-8 px-6 sm:px-8 md:py-10 md:px-10 overflow-y-auto relative z-10">
          <div className="w-full max-w-sm mx-auto animate-fade-up">
            {/* Header */}
            <div className="mb-6">
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block mb-1 font-mono">PORTAL GATEWAY</span>
              <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1.5 leading-tight">Access Control</h1>
              <p className="text-white/40 text-[11px] font-light leading-relaxed">
                Authenticate your credentials to unlock ASL Link capture translation feeds.
              </p>
            </div>

            {/* Sliding Tabs Switcher */}
            <div className="relative flex w-full bg-white/[0.01] p-1 rounded-xl border border-white/[0.05] mb-5">
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/20 rounded-lg transition-all duration-300 ease-out"
                style={{
                  left: mode === 'login' ? '4px' : 'calc(50% + 0px)'
                }}
              />

              <button
                type="button"
                onClick={() => { setMode('login'); setLocalError(''); }}
                className={`flex-1 relative z-10 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none cursor-pointer ${mode === 'login' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setLocalError(''); }}
                className={`flex-1 relative z-10 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none cursor-pointer ${mode === 'register' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
                  }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Username Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 group-focus-within:text-emerald-400 transition-colors">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full glass-input rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                  autoComplete="username"
                />
              </div>

              {/* Collapsible Fields for Registration */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out space-y-3.5 ${mode === 'register' ? 'max-h-64 opacity-100 visible' : 'max-h-0 opacity-0 invisible pointer-events-none'
                  }`}
              >
                {/* Email Address */}
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 group-focus-within:text-emerald-400 transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                    autoComplete="email"
                    disabled={mode !== 'register'}
                  />
                </div>

                {/* Display Name Input */}
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 group-focus-within:text-emerald-400 transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Display Name (optional)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full glass-input rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                    disabled={mode !== 'register'}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 group-focus-within:text-emerald-400 transition-colors">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input rounded-xl py-3.5 pl-12 pr-12 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-emerald-400 focus:outline-none transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Error notifications */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${displayError ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="flex items-center gap-2.5 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <svg className="w-4.5 h-4.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 text-xs font-medium">{displayError}</span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-emerald-500/40 disabled:to-teal-500/40 text-black font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-6 active:scale-[0.98] shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer text-xs tracking-wider uppercase"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs font-bold tracking-wider">{mode === 'login' ? 'SIGNING IN...' : 'REGISTERING...'}</span>
                  </>
                ) : (
                  <span className="text-xs font-bold tracking-wider">{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/20 text-xs font-light uppercase tracking-widest font-mono">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Guest Entrance */}
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-white/70 hover:text-white py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Continue as Guest</span>
            </button>

            {/* Demo Info Banner */}
            <div className="text-center mt-6">
              <p className="text-white/25 text-[10px] font-mono tracking-wide uppercase">
                Demo: <span className="text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded">admin</span> &bull; Pass: <span className="text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded">1234</span>
              </p>
            </div>
          </div>
        </div>

        {/* Vertical Separation Divider inside Card */}
        <div className="hidden md:block w-px bg-white/[0.08] relative z-10 self-stretch my-6" />

        {/* RIGHT COLUMN: Just the Hand Skeleton Canvas */}
        <div className="hidden md:flex md:w-5/12 items-center justify-center relative p-8 overflow-hidden bg-white/[0.01]">
          {!isCameraTesting ? (
            <div className="flex flex-col items-center justify-center text-center p-6 relative z-10 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-lg mb-4">
                <svg className="w-6 h-6 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-2">Camera Interface Standby</h3>
              <p className="text-white/35 text-[10px] font-light leading-relaxed max-w-[200px] mb-6">
                Optionally test your webcam tracking mapping latency before logging into the interface.
              </p>
              <button
                type="button"
                onClick={() => setIsCameraTesting(true)}
                className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] tracking-wider rounded-xl uppercase transition-all duration-200 cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/5"
              >
                Test Camera Tracking
              </button>
            </div>
          ) : (
            <>
              {/* Cybernetic wireframe hand skeleton canvas */}
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="w-[320px] h-[320px] drop-shadow-[0_0_20px_rgba(6,182,212,0.3)] relative z-10"
              />

              {/* Skeleton Style Selector */}
              <div className="absolute bottom-4 right-4 flex gap-1.5 bg-black/60 border border-white/[0.06] p-1 rounded-xl z-20 backdrop-blur-md shadow-2xl">
                {(['neon', 'mesh', 'hud', 'literal'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setSkeletonStyle(style)}
                    className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${skeletonStyle === style
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10'
                        : 'text-white/40 hover:text-white/70'
                      }`}
                  >
                    {style === 'neon' ? 'Neon' : style === 'mesh' ? 'Mesh' : style === 'hud' ? 'HUD' : 'Literal'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Hidden Video element for background landmark tracking */}
      <video ref={videoRef} className="hidden" playsInline muted />
    </div>
  );
}
