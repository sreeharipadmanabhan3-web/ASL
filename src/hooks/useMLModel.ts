import { useState, useEffect, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

interface Prediction {
  word: string;
  confidence: number;
}

interface UseMLModelReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  predict: (landmarks: number[][]) => Promise<Prediction[]>;
  modelInfo: {
    inputShape: number[] | null;
    outputShape: number[] | null;
    numClasses: number;
  };
  vocabulary: string[];
}

function normalizeSequence(sequence: number[][]): number[][] {
  const normalized = sequence.map(frame => [...frame]);

  // Find first frame where hand 1 is detected
  let firstHand1Wrist: [number, number, number] | null = null;
  for (const frame of normalized) {
    if (frame[0] !== 0.0 || frame[1] !== 0.0 || frame[2] !== 0.0) {
      firstHand1Wrist = [frame[0], frame[1], frame[2]];
      break;
    }
  }

  // Find first frame where hand 2 is detected
  let firstHand2Wrist: [number, number, number] | null = null;
  for (const frame of normalized) {
    if (frame[63] !== 0.0 || frame[64] !== 0.0 || frame[65] !== 0.0) {
      firstHand2Wrist = [frame[63], frame[64], frame[65]];
      break;
    }
  }

  for (let fIdx = 0; fIdx < normalized.length; fIdx++) {
    const frame = normalized[fIdx];

    // Normalize hand 1 landmarks (0 to 62)
    if (firstHand1Wrist !== null) {
      let isHand1Detected = false;
      for (let j = 0; j < 63; j++) {
        if (frame[j] !== 0.0) {
          isHand1Detected = true;
          break;
        }
      }

      if (isHand1Detected) {
        for (let j = 0; j < 63; j += 3) {
          frame[j] -= firstHand1Wrist[0];
          frame[j + 1] -= firstHand1Wrist[1];
          frame[j + 2] -= firstHand1Wrist[2];
        }
      }
    }

    // Normalize hand 2 landmarks (63 to 125)
    if (firstHand2Wrist !== null) {
      let isHand2Detected = false;
      for (let j = 63; j < 126; j++) {
        if (frame[j] !== 0.0) {
          isHand2Detected = true;
          break;
        }
      }

      if (isHand2Detected) {
        for (let j = 63; j < 126; j += 3) {
          frame[j] -= firstHand2Wrist[0];
          frame[j + 1] -= firstHand2Wrist[1];
          frame[j + 2] -= firstHand2Wrist[2];
        }
      }
    }
  }

  return normalized;
}

export function useMLModel(
  modelPath: string = '/model/model.json',
  preferredBackend: 'webgl' | 'cpu' = 'webgl'
): UseMLModelReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<string[]>([]);
  const [modelInfo, setModelInfo] = useState<{
    inputShape: number[] | null;
    outputShape: number[] | null;
    numClasses: number;
  }>({
    inputShape: null,
    outputShape: null,
    numClasses: 0
  });

  const modelRef = useRef<tf.LayersModel | tf.GraphModel | null>(null);
  const idxToWordRef = useRef<Record<number, string>>({});

  // Load the model and vocabulary
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      setIsLoading(true);
      setError(null);



      try {
        console.log(`🔄 Setting TFJS backend to: ${preferredBackend}`);
        await tf.setBackend(preferredBackend);
        await tf.ready();
        // Load word_to_idx.json (mandatory)
        let words: string[] = [];
        let idxToWord: Record<number, string> = {};
        try {
          const vocabResponse = await fetch('/model/word_to_idx.json');
          if (!vocabResponse.ok) {
            throw new Error(`Failed to load word_to_idx.json: ${vocabResponse.statusText}`);
          }
          const wordToIdx: Record<string, number> = await vocabResponse.json();
          words = Object.keys(wordToIdx);
          for (const [word, idx] of Object.entries(wordToIdx)) {
            idxToWord[idx] = word;
          }
          if (isMounted) {
            setVocabulary(words);
            idxToWordRef.current = idxToWord;
            console.log('✅ Loaded vocabulary:', words);
          }
        } catch (vocabErr) {
          console.error('❌ Failed to load model vocabulary:', vocabErr);
          throw new Error('Failed to load model vocabulary (word_to_idx.json)');
        }

        // Try to load as LayersModel first (from model.json)
        let model: tf.LayersModel | tf.GraphModel;

        try {
          console.log('🔄 Loading TensorFlow.js model from:', modelPath);
          model = await tf.loadLayersModel(modelPath);
          console.log('✅ Loaded as LayersModel');
        } catch (layersErr) {
          // Try loading as GraphModel (from saved_model conversion)
          console.log('🔄 Trying to load as GraphModel...');
          model = await tf.loadGraphModel(modelPath);
          console.log('✅ Loaded as GraphModel');
        }

        if (!isMounted) {
          model.dispose();
          return;
        }

        modelRef.current = model;

        // Get model info
        let inputShape: number[] | null = null;
        let outputShape: number[] | null = null;

        if ('inputs' in model && model.inputs.length > 0) {
          inputShape = model.inputs[0].shape as number[];
        }
        if ('outputs' in model && model.outputs.length > 0) {
          outputShape = model.outputs[0].shape as number[];
        }

        const numClasses = outputShape ? outputShape[outputShape.length - 1] : words.length;

        setModelInfo({
          inputShape,
          outputShape,
          numClasses: numClasses || words.length
        });
        console.log('🔥 Warming up the model on the CPU/WASM...');

        try {
          // 1. Create a "fake" input tensor filled with zeros.
          // This MUST match the exact shape your predict() function uses: [1 batch, 30 frames, 126 features]
          const dummyInput = tf.zeros([1, 30, 126]);

          // 2. Pass the fake data through the model
          const dummyOutput = model.predict(dummyInput) as tf.Tensor;

          // 3. Await the data. This physically forces the backend to finish the math.
          await dummyOutput.data();

          // 4. TRASH THE TENSORS (Crucial!)
          // If you don't dispose of these, they will sit in memory forever.
          dummyInput.dispose();
          dummyOutput.dispose();

          console.log('✅ Model warmed up and ready to go!');
        } catch (warmupError) {
          console.warn('⚠️ Warm-up failed, but continuing anyway:', warmupError);
        }

        // ==========================================



        console.log('📊 Model info:', {
          inputShape,
          outputShape,
          numClasses
        });

        setIsLoaded(true);
        setIsLoading(false);

      } catch (err) {
        console.error('❌ Failed to load model:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load model');
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, [modelPath, preferredBackend]);

  // Prediction function
  const predict = useCallback(async (landmarks: number[][]): Promise<Prediction[]> => {
    if (!modelRef.current || !isLoaded) {
      console.warn('Model not loaded yet');
      return [];
    }

    try {
      // Prepare input tensor
      // landmarks is array of frames, each frame is 126 features
      const maxFrames = 30;
      const featureSize = 126;

      // Pad or truncate to maxFrames
      let paddedLandmarks = [...landmarks];

      while (paddedLandmarks.length < maxFrames) {
        paddedLandmarks.push(new Array(featureSize).fill(0));
      }

      paddedLandmarks = paddedLandmarks.slice(0, maxFrames);

      // Ensure each frame has exactly featureSize features
      paddedLandmarks = paddedLandmarks.map(frame => {
        if (frame.length < featureSize) {
          return [...frame, ...new Array(featureSize - frame.length).fill(0)];
        }
        return frame.slice(0, featureSize);
      });

      // Normalize sequence relative to the first frame's detected wrist
      const normalizedLandmarks = normalizeSequence(paddedLandmarks);

      // Create tensor with shape [1, 30, 126]
      const outputTensor = tf.tidy(() => {
        const inputTensor = tf.tensor3d([normalizedLandmarks], [1, maxFrames, featureSize]);
        return modelRef.current!.predict(inputTensor) as tf.Tensor;
      });

      const predictionsData = await outputTensor.data();
      outputTensor.dispose();

      // Get top 3 predictions
      const predArray = Array.from(predictionsData);
      const indexed = predArray.map((conf, idx) => ({ idx, conf }));
      indexed.sort((a, b) => b.conf - a.conf);

      let top3 = indexed
        .map(({ idx, conf }) => {
          const word = idxToWordRef.current[idx];
          if (!word) return null;
          return { word, confidence: conf };
        })
        .filter((p): p is Prediction => p !== null)
        .slice(0, 3);

      if (top3.length > 0 && top3[0].confidence < 0.50) {
        top3 = [
          { word: 'Gesture Not Found', confidence: top3[0].confidence },
          ...top3
        ];
      }

      console.log('🔮 Predictions:', top3);
      return top3;

    } catch (err) {
      console.error('❌ Prediction error:', err);
      return [];
    }
  }, [isLoaded, vocabulary]);

  return {
    isLoaded,
    isLoading,
    error,
    predict,
    modelInfo,
    vocabulary
  };
}
