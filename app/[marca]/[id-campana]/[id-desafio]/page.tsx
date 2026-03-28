'use client';

import { use, useState, useMemo } from 'react';
import { getCampaign } from '@/data/campaigns';
import ChallengeIntro from '@/components/ar/ChallengeIntro';
import ARCanvas from '@/components/ar/ARCanvas';
import * as THREE from 'three';

interface PageProps {
  params: Promise<{
    marca: string;
    'id-campana': string;
    'id-desafio': string;
  }>;
}

export default function CampaignPage({ params }: PageProps) {
  const { marca, 'id-campana': idCampana, 'id-desafio': idDesafio } = use(params);
  const [started, setStarted] = useState(false);

  // Load campaign config
  const config = useMemo(() => {
    const fetched = getCampaign(marca, idCampana, idDesafio);
    
    if (fetched && !fetched.brandObjects) {
      // Inject some default brand objects from here as a demo of the page-level configuration
      fetched.brandObjects = (group: THREE.Group) => {
        // Example: Add a brand-colored floating cube above the face/pose/hand
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshStandardMaterial({ 
          color: fetched.brandColor || 0xffffff,
          metalness: 0.8,
          roughness: 0.2
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.y = 0.5; // Positioning it relative to the tracker center
        group.add(cube);

        // Add a simple light for the brand object
        const light = new THREE.PointLight(0xffffff, 1, 10);
        light.position.set(0, 2, 2);
        group.add(light);
      };
    }
    
    return fetched;
  }, [marca, idCampana, idDesafio]);

  if (!config) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 opacity-10 flex flex-col">
          <span>Error 404</span>
          <span>Campaña no encontrada</span>
        </h1>
        <p className="opacity-40 max-w-sm">
          La URL de la campaña no es válida o el desafío ha finalizado.
        </p>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen overflow-hidden">
      {!started ? (
        <ChallengeIntro config={config} onStart={() => setStarted(true)} />
      ) : (
        <ARCanvas config={config} />
      )}
    </main>
  );
}
