import { ExecutiveMap } from '../../../../components/executive-map';

export default function ExecutiveMapPage() {
  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Maps</p>
        <h2>Mapa executivo</h2>
      </header>
      <ExecutiveMap />
    </section>
  );
}
