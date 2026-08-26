# Configuración de Prisma + MongoDB — paso a paso

Guía de cómo configurar este proyecto desde cero (Prisma Next `8.0.0-rc` + `@prisma/orm-mongo` sobre MongoDB Atlas).

## 1. Iniciar el proyecto Node

```bash
npm init -y
```

> Por defecto `npm init -y` deja `"type": "commonjs"` en `package.json`. Este proyecto usa `import`/`export` de ES Modules, así que hay que cambiarlo a:
> ```json
> "type": "module"
> ```

## 2. Instalador de Prisma Next (`prisma orm init`)

En vez de instalar y armar cada archivo a mano, Prisma Next trae un instalador que scaffoldea todo el proyecto de un tirón:

```bash
npx prisma orm init --target mongodb --authoring psl
```

Este comando hace, en un solo paso:
- Instala las dependencias necesarias (`@prisma/orm-mongo`, `dotenv`, y `prisma` como dev dependency, entre otras).
- Genera **`.env.example`** con el formato de `DATABASE_URL` esperado para Mongo.
- Genera **`prisma.config.ts`** (le dice a la CLI dónde está el contrato y cómo conectar).
- Genera un **`src/prisma/contract.prisma`** de arranque (modelo de ejemplo).
- Corre `prisma contract emit` para generar `contract.json` y `contract.d.ts`.
- Deja un **`prisma-next.md`** en la raíz con la documentación de referencia de la herramienta.

Flags relevantes:

| Flag | Para qué sirve |
|---|---|
| `--target mongodb` | Fija el motor de base de datos (alternativa: `postgres`) |
| `--authoring psl` | Define el schema con sintaxis `.prisma` clásica (alternativa: `typescript`) |
| `--write-env` | Además crea el `.env` real copiando `.env.example` (queda gitignoreado) |
| `--probe-db` | Se conecta a `DATABASE_URL` una vez para verificar la versión del server |
| `--skip-install` | No instala dependencias ni corre `contract emit` (útil si ya están) |
| `--yes` | Corre en modo no interactivo, aceptando los valores por defecto |

Si se corre sin `--yes`, el instalador guía la configuración de forma interactiva (pregunta target, authoring style, si generar `.env`, etc.) — útil la primera vez para ver todas las opciones.

## 3. Variables de entorno

Copiar `.env.example` → `.env` (si no se usó `--write-env` en el paso anterior) y completar la cadena de conexión real:

```env
DATABASE_URL=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/nombre_db
```

Requisitos:
- MongoDB **8.0+**.
- El string `mongodb+srv://` resuelve los hosts del clúster vía DNS (registros `SRV`/`TXT`), así que la máquina necesita poder hacer esas consultas (ver sección 8, es la causa más común de fallos de conexión).

## 4. `prisma.config.ts`

Generado por el instalador; le dice a la CLI dónde está el contrato y cómo conectar:

```typescript
import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-mongo/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
});
```

## 5. El contrato de datos (`contract.prisma`)

El instalador deja un modelo de ejemplo en `src/prisma/contract.prisma`. Se edita para definir los modelos reales del proyecto, con la misma sintaxis de Prisma clásico:

```prisma
model User {
  id       ObjectId @id @map("_id")
  email    String   @unique
  username String?
  name     String?
  posts    Post[]
  @@map("users")
}

model Post {
  id       ObjectId @id @map("_id")
  title    String
  content  String?
  author   User     @relation(fields: [authorId], references: [id])
  authorId ObjectId
  @@map("posts")
}
```

Puntos importantes de Mongo:
- `id` siempre es `ObjectId @id @map("_id")`.
- `@@map("...")` fija el nombre real de la colección.
- `@unique` **se declara aquí, pero no se aplica solo** — hay que sincronizarlo con la base (paso 7).

## 6. Compilar el contrato

Cada vez que se edita `contract.prisma` (el instalador ya corrió esto una vez, pero hay que repetirlo tras cada cambio):

```bash
npx prisma contract emit
```

Esto regenera dos archivos que sí se commitean:

| Archivo | Para qué sirve |
|---|---|
| `src/prisma/contract.json` | Manifiesto que usa el cliente en tiempo de ejecución (incluye índices, validadores JSON Schema, relaciones) |
| `src/prisma/contract.d.ts` | Tipos para autocompletado en el editor |

## 7. Sincronizar el contrato con la base de datos

A diferencia de Postgres/MySQL, en Mongo el contrato **no se aplica solo**. Hay que correr un comando explícito para crear colecciones, índices y validadores.

### Primera vez (base vacía o recién creada)

```bash
npx prisma db init
```

Crea todo lo que el contrato declara y la base no tiene, usando **solo operaciones aditivas**. Si algo requeriría una operación destructiva, el comando se detiene sin aplicar nada.

### Cuando ya hay datos / colecciones previas

Si `db init` se detiene por una operación "destructive" (por ejemplo, añadir un validador estricto a una colección que ya existe con datos), hay que usar:

```bash
npx prisma db update --dry-run   # previsualiza qué va a hacer (recomendado antes de aplicar)
npx prisma db update             # pide confirmar el nombre de la base por consola
npx prisma db update --no-interactive --confirm <nombre_db>   # para CI / scripts
```

> ⚠️ En algunas builds release-candidate de la CLI, `--confirm <db>` puede fallar con `CLI.CONSENT_TOKEN_UNRESOLVED` ("the connected database reports no name") incluso pasando `--db`. Si pasa, la alternativa es aplicar las operaciones a mano con el driver `mongodb` (los comandos exactos salen en el `--dry-run`, campo `preview.statements`) y luego firmar la base como en el paso siguiente.

### Firmar y verificar

Tras aplicar el schema (por `db update` o a mano), hay que dejar una "firma" que registra que la base coincide con el contrato:

```bash
npx prisma db sign     # escribe/actualiza la marca de firma
npx prisma db verify   # confirma que la firma y el schema real coinciden con el contrato
```

`db verify` debe devolver `"Database marker and schema match contract"`.

## 8. Problema común: conexión falla con `ECONNREFUSED` en `querySrv`/`queryA`

Si `npx prisma db init` (o la app) falla con algo como:

```
✘ [DRIVER.CONNECTION_FAILED] Database connection failed
  why: querySrv ECONNREFUSED _mongodb._tcp.cluster0.xxxxx.mongodb.net
```

**No es un problema de Mongo ni de credenciales.** Es el resolutor DNS interno de Node (`c-ares`), que en algunas máquinas Windows queda apuntando a `127.0.0.1` (donde no hay ningún servidor DNS escuchando) en vez de a los DNS reales del adaptador de red, aunque Windows sí resuelva bien por su cuenta.

Diagnóstico rápido:

```bash
node -e "console.log(require('dns').getServers())"
# si imprime ['127.0.0.1'], ese es el problema
```

Solución — forzar DNS explícitos antes de conectar, dentro de `src/prisma/db.ts`:

```typescript
import dns from 'node:dns';
dns.setServers(['1.1.1.1', '1.0.0.1']);
```

Esto cubre la app (`npm run dev` / `npm start`), porque todo pasa por `db.ts`. **No cubre a la CLI de Prisma** (`npx prisma ...`), que corre en un proceso Node aparte. Para correr comandos de la CLI en una máquina con este problema, hay que precargar el mismo fix:

```bash
# Windows PowerShell
$env:NODE_OPTIONS="--require C:\ruta\al\dns-fix-preload.cjs"
npx prisma db init

# bash
NODE_OPTIONS="--require ./dns-fix-preload.cjs" npx prisma db init
```

con `dns-fix-preload.cjs`:

```javascript
require('node:dns').setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']);
```

## 9. Uso en la aplicación

Cliente centralizado en `src/prisma/db.ts`:

```typescript
import { db } from '../prisma/db'

const user = await db.orm.users.create({
  email: 'jane@prisma.io',
  name: 'Jane',
  username: 'pepito',
})
```

`db` conecta de forma perezosa (lazy) en la primera query — no hace falta un `connect()` manual. Si algún día hace falta liberar la conexión (tests, scripts cortos): `await db.close()`.

## 10. Checklist para levantar el proyecto desde cero

1. `npm init -y` y cambiar `"type": "commonjs"` → `"type": "module"`
2. `npx prisma orm init --target mongodb --authoring psl`
3. Completar `.env` con el `DATABASE_URL` real (si no se usó `--write-env`)
4. Editar `src/prisma/contract.prisma` con los modelos del proyecto
5. `npx prisma contract emit`
6. `npx prisma db init` (o `db update` + `db sign` si la base ya tiene datos/colecciones)
7. `npx prisma db verify` → debe decir que coincide
8. Agregar scripts de `dev`/`start` en `package.json` y levantar la app

## 11. Comandos de referencia

| Comando | Qué hace |
|---|---|
| `npx prisma orm init` | Scaffoldea el proyecto completo (config, contrato, dependencias, `.env.example`) |
| `npx prisma contract emit` | Recompila `contract.prisma` → `contract.json` + `contract.d.ts` |
| `npx prisma db init` | Crea en la base lo que falte, solo si es aditivo |
| `npx prisma db update [--dry-run]` | Igual que `db init` pero también permite cambios destructivos (con confirmación) |
| `npx prisma db sign` | Registra que la base coincide con el contrato actual |
| `npx prisma db verify` | Comprueba que la firma y el schema real coinciden con el contrato |
| `npx prisma db schema` | Inspecciona el schema real de la base |
| `npx prisma migration status` | Estado de las migraciones planificadas |
