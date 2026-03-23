import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Permite acceso desde otros dispositivos en la red local (LAN multiplayer).
  // Next.js 16 bloquea por defecto los JS bundles para orígenes no-localhost,
  // lo que impide la hidratación de React en el segundo dispositivo.
  allowedDevOrigins: [
    "192.168.0.*",
    "192.168.1.*",
    "192.168.2.*",
    "10.0.*.*",
    "10.1.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
};

export default nextConfig;
