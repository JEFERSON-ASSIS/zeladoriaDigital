import { HeatmapView } from '../../../../components/heatmap-view';

export default function HeatmapPage() {
  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Heatmap</p>
        <h2>Mapa de calor</h2>
      </header>
      <HeatmapView />
    </section>
  );
}
