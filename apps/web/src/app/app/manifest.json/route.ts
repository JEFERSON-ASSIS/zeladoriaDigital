export async function GET() {
  return new Response('PWA disponível apenas em /app/unidade/psf1, /app/unidade/psf2 ou /app/unidade/psf3.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
