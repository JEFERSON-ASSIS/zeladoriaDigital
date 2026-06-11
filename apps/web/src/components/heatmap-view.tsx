'use client';

const points = [
  { bairro: 'Centro', quantidade: 15 },
  { bairro: 'Jardim das Flores', quantidade: 11 },
  { bairro: 'Nova Esperança', quantidade: 8 }
];

export function HeatmapView() {
  const total = points.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <div className="heatmap-card">
      {points.map((item) => (
        <div key={item.bairro} className="heat-row">
          <div className="heat-row-top">
            <span>{item.bairro}</span>
            <strong>{item.quantidade}</strong>
          </div>
          <div className="heat-bar">
            <div className="heat-fill" style={{ width: `${(item.quantidade / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
