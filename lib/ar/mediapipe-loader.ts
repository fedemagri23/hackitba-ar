import { FilesetResolver, FaceLandmarker, PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { TrackingMode } from './tracking-types';

export async function createLandmarker(mode: TrackingMode) {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  if (mode === 'face') {
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: 'GPU'
      },
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO',
      numFaces: 1
    });
  } else if (mode === 'pose') {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1
    });
  } else {
    return await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 2
    });
  }
}
