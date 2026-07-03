import { PWA_MANIFEST_URL } from '../../lib/pwa-constants';

export default function Head() {
  return <link id="zeladoria-login-manifest" rel="manifest" href={PWA_MANIFEST_URL} />;
}
