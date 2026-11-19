import { useParams } from 'react-router';
import { PendulumLab } from '../labs/physics-pendulum';
import { TitrationLab } from '../labs/chemistry-titration';
import { DigestionLab } from '../labs/biology-digestion';
import { OhmsLawLab } from '../labs/electronics-ohms-law';
import { BeamLab } from '../labs/engineering-beam';

const labComponents: Record<string, React.ComponentType> = {
  'physics-pendulum': PendulumLab,
  'chemistry-titration': TitrationLab,
  'biology-digestion': DigestionLab,
  'electronics-ohms-law': OhmsLawLab,
  'engineering-beam': BeamLab,
};

/**
 * Lab workspace router (D1-D7)
 * Routes to the appropriate lab component based on experimentId
 */
export function LabWorkspace() {
  const { experimentId } = useParams<{ experimentId: string }>();

  if (!experimentId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">No Experiment Selected</h1>
          <p className="text-neutral-600">Please select an experiment from the library.</p>
        </div>
      </div>
    );
  }

  const LabComponent = labComponents[experimentId];

  if (!LabComponent) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Lab Not Found</h1>
          <p className="text-neutral-600 mb-4">
            The experiment "{experimentId}" is not available yet.
          </p>
          <div className="text-sm text-neutral-500">
            <p className="font-semibold mb-2">Available labs:</p>
            <ul className="list-disc list-inside text-left mx-auto inline-block">
              {Object.keys(labComponents).map(id => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <LabComponent />;
}
