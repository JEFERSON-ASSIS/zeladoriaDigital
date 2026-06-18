'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapRegionPicker } from '../../../components/map-region-picker';
import { PushLogsHistory } from '../../../components/push-logs-history';
import { fetchServiceAreas, getStoredAccessToken, saveServiceArea } from '../../../lib/api';
import { DEFAULT_MAP_REGION, mapRegionFromServiceArea, type MapRegionConfig } from '../../../lib/map-region';

async function geocodeMunicipality(municipio: string, estado: string) {
  const query = `${municipio}, ${estado}, Brasil`;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { 'Accept-Language': 'pt-BR' } }
  );
  if (!response.ok) return null;
  const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return results[0] ?? null;
}

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MapRegionConfig>(DEFAULT_MAP_REGION);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const areas = useQuery({
    queryKey: ['service-area'],
    queryFn: () => fetchServiceAreas(getStoredAccessToken()),
    staleTime: 30_000
  });

  useEffect(() => {
    const active = (areas.data ?? []).find((area) => area.ativo) ?? areas.data?.[0];
    if (active) {
      setForm(mapRegionFromServiceArea(active));
    }
  }, [areas.data]);

  const saveMutation = useMutation({
    mutationFn: () => saveServiceArea(form, getStoredAccessToken()),
    onSuccess: (saved) => {
      setForm(mapRegionFromServiceArea(saved));
      setSuccess('Região dos mapas salva com sucesso.');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['service-area'] });
      queryClient.invalidateQueries({ queryKey: ['map-region'] });
    },
    onError: () => setError('Não foi possível salvar a configuração da região.')
  });

  async function locateCity() {
    if (!form.municipio.trim() || form.estado.trim().length < 2) {
      setError('Informe município e UF antes de localizar.');
      return;
    }
    setLocating(true);
    setError(null);
    try {
      const result = await geocodeMunicipality(form.municipio.trim(), form.estado.trim());
      if (!result) {
        setError('Cidade não encontrada. Ajuste o nome ou clique diretamente no mapa.');
        return;
      }
      setForm((current) => ({
        ...current,
        latitudeCentro: Number(result.lat),
        longitudeCentro: Number(result.lon)
      }));
      setSuccess(`Centro atualizado para ${form.municipio}.`);
    } catch {
      setError('Não foi possível buscar a localização da cidade.');
    } finally {
      setLocating(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim() || !form.municipio.trim() || form.estado.trim().length < 2) {
      setError('Preencha nome, município e estado (UF).');
      return;
    }
    if (!form.latitudeCentro || !form.longitudeCentro) {
      setError('Defina o centro da região clicando no mapa ou usando "Localizar cidade".');
      return;
    }
    saveMutation.mutate();
  }

  const radiusKm = (form.raioMetros / 1000).toFixed(1);

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Configurações</p>
        <h2>Região exibida nos mapas</h2>
        <p>Configure o município atendido, centralize no mapa e ajuste o raio de visualização dos chamados.</p>
      </header>

      <div className="config-map-layout">
        <section className="panel config-map-panel">
          <div className="panel-heading">
            <div>
              <h3>Mapa da região</h3>
              <p className="muted-copy">Clique no mapa para definir o centro ou use o botão de localizar cidade.</p>
            </div>
          </div>
          <MapRegionPicker
            latitude={form.latitudeCentro}
            longitude={form.longitudeCentro}
            raioMetros={form.raioMetros}
            onPick={({ latitude, longitude }) =>
              setForm((current) => ({ ...current, latitudeCentro: latitude, longitudeCentro: longitude }))
            }
          />
        </section>

        <section className="panel config-form-panel">
          <h3>Dados da região</h3>
          <form className="occurrence-form region-config-form" onSubmit={handleSubmit}>
            <fieldset className="region-fieldset">
              <legend>Identificação</legend>
              <label>
                Nome da região
                <input
                  value={form.nome}
                  onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
                  placeholder="Ex.: Município de Vera"
                />
              </label>
              <div className="region-form-row region-form-row--city">
                <label>
                  Município
                  <input
                    value={form.municipio}
                    onChange={(e) => setForm((current) => ({ ...current, municipio: e.target.value }))}
                    placeholder="Ex.: Vera"
                  />
                </label>
                <label className="region-field-uf">
                  UF
                  <input
                    value={form.estado}
                    maxLength={2}
                    onChange={(e) => setForm((current) => ({ ...current, estado: e.target.value.toUpperCase() }))}
                    placeholder="MT"
                  />
                </label>
              </div>
              <button type="button" className="btn-secondary region-locate-btn" onClick={locateCity} disabled={locating}>
                {locating ? 'Localizando...' : 'Localizar cidade no mapa'}
              </button>
            </fieldset>

            <fieldset className="region-fieldset">
              <legend>Centro e área</legend>
              <div className="region-form-row">
                <label>
                  Latitude
                  <input
                    type="number"
                    step="any"
                    value={form.latitudeCentro}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, latitudeCentro: Number(e.target.value) || 0 }))
                    }
                  />
                </label>
                <label>
                  Longitude
                  <input
                    type="number"
                    step="any"
                    value={form.longitudeCentro}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, longitudeCentro: Number(e.target.value) || 0 }))
                    }
                  />
                </label>
              </div>
              <label className="region-range-label">
                <span>Raio de exibição: <strong>{radiusKm} km</strong></span>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={500}
                  value={form.raioMetros}
                  onChange={(e) => setForm((current) => ({ ...current, raioMetros: Number(e.target.value) }))}
                />
              </label>
            </fieldset>

            <fieldset className="region-fieldset">
              <legend>Regras de atendimento</legend>
              <div className="region-options">
                <label className="region-option">
                  <input
                    type="checkbox"
                    checked={form.validacaoAtiva}
                    onChange={(e) => setForm((current) => ({ ...current, validacaoAtiva: e.target.checked }))}
                  />
                  <span>
                    <strong>Validar ocorrências</strong>
                    <small>Verifica se o chamado está dentro da região configurada.</small>
                  </span>
                </label>
                <label className="region-option">
                  <input
                    type="checkbox"
                    checked={form.bloquearForaDaArea}
                    onChange={(e) => setForm((current) => ({ ...current, bloquearForaDaArea: e.target.checked }))}
                  />
                  <span>
                    <strong>Bloquear fora da área</strong>
                    <small>Impede novas solicitações fora do município/raio.</small>
                  </span>
                </label>
              </div>
            </fieldset>

            <div className="form-actions region-form-actions">
              <button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar configuração'}
              </button>
            </div>
            {success ? <p className="success-message">{success}</p> : null}
            {error ? <p className="login-error">{error}</p> : null}
          </form>
        </section>
      </div>

      <PushLogsHistory />
    </section>
  );
}
