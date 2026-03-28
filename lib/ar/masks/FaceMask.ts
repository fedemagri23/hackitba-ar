import * as THREE from 'three';
import { NormalizedLandmark } from '../tracking-types';
import { landmarkToThree, midpointThree, directionToEuler } from '../landmark-mapper';

/**
 * FaceMask — Three.js Group with:
 *   - A wireframe ovoid (scaled sphere) for the head
 *   - Optional child attachment points accessible from page.tsx
 *
 * Usage from page.tsx:
 *   const mask = new FaceMask();
 *   mask.addBrandObject(myMesh); // adds a child that moves with the face
 *   scene.add(mask.group);
 *   // on each frame:
 *   mask.update(landmarks, aspect);
 */
export class FaceMask {
  group: THREE.Group;
  private headMesh: THREE.Mesh;

  constructor(color = 0xffffff) {
    this.group = new THREE.Group();

    // Ovoid head — scaled sphere
    const geo = new THREE.SphereGeometry(0.12, 20, 14);
    const mat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.headMesh = new THREE.Mesh(geo, mat);
    // Squish to an oval (wider than tall, but face-shaped)
    this.headMesh.scale.set(1, 1.3, 0.85);
    this.group.add(this.headMesh);
  }

  /** Add any brand 3D object as a child—it will follow the face. */
  addBrandObject(obj: THREE.Object3D): void {
    this.group.add(obj);
  }

  /**
   * Call every frame with the raw MediaPipe face landmark array (478 points).
   * Key indices used:
   *   1  = nose tip (centre reference)
   *  10  = forehead top (for radius)
   * 152  = chin
   * 234  = left cheek
   * 454  = right cheek
   */
  update(landmarks: NormalizedLandmark[], aspect: number): void {
    if (!landmarks || landmarks.length < 455) return;

    const nose = landmarkToThree(landmarks[1], aspect);
    const forehead = landmarkToThree(landmarks[10], aspect);
    const chin = landmarkToThree(landmarks[152], aspect);
    const leftCheek = landmarkToThree(landmarks[234], aspect);
    const rightCheek = landmarkToThree(landmarks[454], aspect);

    // Centre of head = midpoint forehead↔chin
    const center = midpointThree(forehead, chin);
    this.group.position.copy(center);

    // Scale based on face width/height
    const faceHeight = forehead.distanceTo(chin);
    const faceWidth = leftCheek.distanceTo(rightCheek);
    const depth = faceWidth * 0.6;

    this.headMesh.scale.set(faceWidth * 0.5, faceHeight * 0.5, depth * 0.5);

    // Face plane normal — use nose tip relative to center
    const faceNormal = new THREE.Vector3().subVectors(nose, center).normalize();
    const up = new THREE.Vector3().subVectors(forehead, chin).normalize();
    const right = new THREE.Vector3().crossVectors(up, faceNormal).normalize();
    const m = new THREE.Matrix4().makeBasis(right, up, faceNormal);
    this.group.setRotationFromMatrix(m);
  }
}
