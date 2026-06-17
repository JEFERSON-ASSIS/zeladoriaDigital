import { ExecutiveMap } from '../../../../components/executive-map';

export default function ExecutiveMapPage() {
  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Mapas</p>
        <h2>Mapa executivo</h2>
      </header>
      <ExecutiveMap />
    </section>
  );
}
