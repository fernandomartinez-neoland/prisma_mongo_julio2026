import 'dotenv/config';
import dns from 'node:dns';
import mongo from '@prisma/orm-mongo/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

// Workaround: en esta máquina el DNS por defecto de Node apunta a 127.0.0.1
// (nada escucha ahí), así que las consultas SRV/A de Mongo Atlas fallan con
// ECONNREFUSED aunque Windows sí resuelva bien por su cuenta. Forzamos DNS
// públicos explícitos. Ver docs/prisma-mongo-setup.md, sección 8.
dns.setServers(['1.1.1.1', '1.0.0.1']);

export const db = mongo<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
