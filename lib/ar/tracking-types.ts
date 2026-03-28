import * as THREE from 'three';

export type TrackingMode = 'face' | 'pose' | 'hand';

export interface CampaignConfig {
  brand: string;
  campaignId: string;
  challengeId: string;
  campaignName: string;
  campaignDescription: string;
  prize: string;
  challengeTitle: string;
  challengeDescription: string;
  termsAndConditions: string;
  trackingMode: TrackingMode;
  brandColor: string; // hex for any brand accent on 3D objects
  brandObjects?: (scene: THREE.Group) => void; // callback to add 3D brand objects
}

// Normalized [0,1] landmark from MediaPipe
export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface ARTrackingResult {
  landmarks: NormalizedLandmark[][];
  worldLandmarks?: NormalizedLandmark[][];
}
