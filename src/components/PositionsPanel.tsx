// =============================================================================
// PositionsPanel — Buy position upgrades for each rank
// =============================================================================

import { useSchoolStore } from '../store/schoolStore';
import { POSITION_DATA, POSITION_IDS, type PositionId } from '../types/game';

export function PositionsPanel() {
  const { config, resources, buyPosition } = useSchoolStore();
  const positions = config?.positions ?? { phd: 0, assistant: 0, associate: 0, professor: 0 };
  const maxCapacity = config?.maxCapacity ?? 0;

  return (
    <div className="positions-panel">
      <h2>Positions</h2>
      <div className="positions-grid">
        {POSITION_IDS.map((posId) => (
          <PositionCard key={posId} positionId={posId} positions={positions} maxCapacity={maxCapacity} />
        ))}
      </div>
      <div className="positions-summary">
        <span>Total slots: <strong>{config.maxCapacity}</strong></span>
      </div>
    </div>
  );
}

function PositionCard({ positionId, positions, maxCapacity }: { positionId: PositionId; positions: PositionCounts; maxCapacity: number }) {
  const { resources, buyPosition } = useSchoolStore();
  const data = POSITION_DATA[positionId];
  const currentCount = positions[positionId];
  const nextCost = data.baseCost + currentCount * data.costPerLevel;
  const canAfford = resources.money >= nextCost;

  const handleClick = () => {
    if (canAfford) {
      buyPosition(positionId);
    }
  };

  return (
    <div
      className={`position-card ${canAfford ? 'affordable' : ''}`}
      style={{ borderLeftColor: data.color }}
    >
      <div className="position-header">
        <span className="position-emoji">{data.emoji}</span>
        <span className="position-name">{data.label}</span>
      </div>
      <div className="position-count">
        <span className="position-level">{currentCount}</span>
        <span className="position-label">slot{currentCount !== 1 ? 's' : ''}</span>
      </div>
      {nextCost > 0 ? (
        <button
          className="buy-btn"
          onClick={handleClick}
          disabled={!canAfford}
          title={`Buy: ${nextCost}💰 (next level ${currentCount + 1})`}
        >
          <span className="cost">+1 {nextCost}💰</span>
          {!canAfford && <span className="cant-afford">(need more)</span>}
        </button>
      ) : (
        <span className="included">Included</span>
      )}
    </div>
  );
}
