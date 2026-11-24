import { useParams } from 'react-router';
import { PendulumLab } from '../labs/physics-pendulum/PendulumLab';
import { RefractionLab } from '../labs/physics-refraction/RefractionLab';
import { MomentsLab } from '../labs/physics-moments/MomentsLab';
import { TitrationLab } from '../labs/chemistry-titration/TitrationLab';
import { QualitativeAnalysisLab } from '../labs/chemistry-qualitative/QualitativeAnalysisLab';
import { DigestionLab } from '../labs/biology-digestion/DigestionLab';
import { DissectionLab } from '../labs/biology-dissection/DissectionLab';
import { BodySystemsLab } from '../labs/biology-body-systems/BodySystemsLab';
import { FoodTestsLab } from '../labs/biology-food-tests/FoodTestsLab';
import { OhmsLawLab } from '../labs/electronics-ohms-law/OhmsLawLab';
import { BeamLab } from '../labs/engineering-beam/BeamLab';
import { IsometricDrawingLab } from '../labs/engineering-isometric/IsometricDrawingLab';

export type LabCode =
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D5'
  | 'D6'
  | 'D7'
  | 'refraction'
  | 'moments'
  | 'qualitative-analysis'
  | 'food-tests'
  | 'isometric';

interface LabWorkspaceProps {
  labCode: LabCode;
}

export function LabWorkspace({ labCode }: LabWorkspaceProps) {
  const { slug } = useParams<{ slug?: string }>();

  // If mounted via /app/x/:slug/lab, resolve slug first
  if (slug) {
    switch (slug) {
      case 'glass-block-refraction':
        return <RefractionLab />;
      case 'principle-of-moments':
        return <MomentsLab />;
      case 'acid-base-titration':
        return <TitrationLab />;
      case 'qualitative-analysis':
        return <QualitativeAnalysisLab />;
      case 'journey-of-food':
        return <DigestionLab />;
      case 'rat-dissection':
        return <DissectionLab />;
      case 'body-systems':
        return <BodySystemsLab />;
      case 'food-tests':
        return <FoodTestsLab />;
      case 'ohms-law':
      case 'diode-iv':
        return <OhmsLawLab />;
      case 'beam-deflection':
      case 'bernoulli-apparatus':
        return <BeamLab />;
      case 'isometric-drawing':
        return <IsometricDrawingLab />;
      default:
        return <PendulumLab />;
    }
  }

  switch (labCode) {
    case 'D1':
      return <PendulumLab />;
    case 'refraction':
      return <RefractionLab />;
    case 'moments':
      return <MomentsLab />;
    case 'D2':
      return <TitrationLab />;
    case 'qualitative-analysis':
      return <QualitativeAnalysisLab />;
    case 'D3':
      return <DigestionLab />;
    case 'D4':
      return <DissectionLab />;
    case 'D5':
      return <BodySystemsLab />;
    case 'food-tests':
      return <FoodTestsLab />;
    case 'D6':
      return <OhmsLawLab />;
    case 'D7':
      return <BeamLab />;
    case 'isometric':
      return <IsometricDrawingLab />;
    default:
      return <PendulumLab />;
  }
}
