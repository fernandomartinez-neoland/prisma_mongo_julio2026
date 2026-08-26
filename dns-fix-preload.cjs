// Preload para la CLI de Prisma: mismo workaround de DNS que src/prisma/db.ts,
// necesario acá porque los subprocesos de la CLI no importan ese archivo.
// Uso: $env:NODE_OPTIONS="--require $PWD\dns-fix-preload.cjs"; npx prisma db init
require('node:dns').setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']);
