declare module '@mediapipe/tasks-vision' {
  export interface BaseOptions {
    modelAssetPath?: string;
    delegate?: 'GPU' | 'CPU';
  }

  export interface HandLandmarkerOptions {
    baseOptions: BaseOptions;
    runningMode: 'IMAGE' | 'VIDEO' | 'LIVE_STREAM';
    numHands?: number;
    minHandDetectionConfidence?: number;
    minHandPresenceConfidence?: number;
    minTrackingConfidence?: number;
    resultCallback?: (result: HandLandmarkerResult, image: any, timestampMs: number) => void;
  }

  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
  }

  export interface Category {
    categoryName: string;
    score: number;
    index: number;
    displayName: string;
  }

  export interface HandLandmarkerResult {
    landmarks: NormalizedLandmark[][];
    worldLandmarks: NormalizedLandmark[][];
    handedness: Category[][];
  }

  export class HandLandmarker {
    static createFromOptions(
      vision: any,
      options: HandLandmarkerOptions,
    ): Promise<HandLandmarker>;
    detectForVideo(
      video: HTMLVideoElement,
      timestampMs: number,
    ): HandLandmarkerResult;
    detect(image: any): HandLandmarkerResult;
    close(): void;
  }

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<any>;
  }
}
