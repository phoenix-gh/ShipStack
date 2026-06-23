export function getPublicAppName() {
  return import.meta.env.VITE_APP_NAME ?? "ShipStack App";
}
