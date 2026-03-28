import { CampaignConfig } from '@/lib/ar/tracking-types';

/**
 * Hardcoded campaign data.
 * Structure: campaigns[marca][id-campana][id-desafio]
 *
 * To replace with an API, swap this lookup for a fetch() call.
 */
export const campaigns: Record<string, Record<string, Record<string, CampaignConfig>>> = {
  nike: {
    'verano-2025': {
      'salto-desafio': {
        brand: 'Nike',
        campaignId: 'verano-2025',
        challengeId: 'salto-desafio',
        campaignName: 'Verano 2025 — Just Move',
        campaignDescription:
          'Nike te invita a vivir el verano en movimiento. Esta campaña celebra cada paso, salto y giro que das bajo el sol. Participá y formá parte de la comunidad que no se detiene.',
        prize:
          'Ganate un par de Air Max 95 edición verano + voucher de $50.000 para la tienda Nike.',
        challengeTitle: 'Desafío del Salto',
        challengeDescription:
          'Ponete de pie frente a la cámara y realizá el mayor salto que puedas. El sistema medirá tu elevación con IA. ¡El que más salta, gana!',
        termsAndConditions: `Términos y Condiciones — Campaña Nike Verano 2025

1. PARTICIPANTES
Pueden participar personas mayores de 18 años residentes en la República Argentina.

2. MECÁNICA
El participante debe completar el desafío de realidad aumentada disponible en la URL de la campaña. El sistema registra automáticamente el resultado.

3. PREMIO
El primer lugar recibirá un par de Nike Air Max 95 Verano 2025 en el talle indicado en el registro y un voucher de $50.000 en la tienda online oficial de Nike Argentina.

4. DETERMINACIÓN DEL GANADOR
El ganador será determinado por el algoritmo de detección de pose de Nike. La decisión es inapelable.

5. PRIVACIDAD
El video de la cámara se procesa localmente en el dispositivo del usuario y no se transmite a ningún servidor. Nike no almacena imágenes ni videos de los participantes.

6. DURACIÓN
La campaña es válida del 1 de enero al 31 de marzo de 2025.

7. CONTACTO
Para consultas: hola@nike.com.ar`,
        trackingMode: 'pose',
        brandColor: '#ffffff',
      },
    },
    'running-2025': {
      'carrera-desafio': {
        brand: 'Nike',
        campaignId: 'running-2025',
        challengeId: 'carrera-desafio',
        campaignName: 'Running 2025',
        campaignDescription:
          'Desafío de running con seguimiento de manos para marcar el ritmo.',
        prize: 'Nike Running pack valorado en $80.000.',
        challengeTitle: 'Desafío del Ritmo',
        challengeDescription:
          'Mové tus manos al ritmo de la música. La cámara detectará tus movimientos.',
        termsAndConditions: 'Términos y condiciones estándar Nike Argentina.',
        trackingMode: 'hand',
        brandColor: '#ffffff',
      },
    },
  },
  adidas: {
    'originals-25': {
      'cara-desafio': {
        brand: 'Adidas',
        campaignId: 'originals-25',
        challengeId: 'cara-desafio',
        campaignName: 'Originals 2025 — Be Original',
        campaignDescription:
          'Adidas Originals celebra la autenticidad. Mostrale al mundo quién sos con el filtro de realidad aumentada más original del año.',
        prize:
          'Ganate una colección completa Adidas Originals 2025 valorada en $120.000.',
        challengeTitle: 'Desafío de la Máscara',
        challengeDescription:
          'Mirá a la cámara y dejá que el filtro AR de Adidas cubra tu cara con la nueva colección. Mantené la pose por 5 segundos.',
        termsAndConditions:
          'Términos y condiciones estándar Adidas Argentina 2025. Mayores de 18 años. Solo para residentes en Argentina.',
        trackingMode: 'face',
        brandColor: '#ffffff',
      },
    },
  },
};

export function getCampaign(
  marca: string,
  idCampana: string,
  idDesafio: string
): CampaignConfig | null {
  return campaigns[marca]?.[idCampana]?.[idDesafio] ?? null;
}
