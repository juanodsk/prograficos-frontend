# Guía de desarrollo de Frontend Prográficos

Esta guía establece las reglas para mantener y ampliar el frontend. Describe primero la arquitectura observada y después define el estándar objetivo. Cuando una regla contradiga código heredado, la regla aplica al código nuevo y el código existente se migra de forma incremental, con pruebas y sin refactorizaciones laterales innecesarias.

## 1. Principios obligatorios

1. **Una sola fuente de verdad.** Rutas, roles, estados y contratos no deben duplicarse en varias capas sin una razón explícita.
2. **Dependencias hacia adentro.** Las vistas usan componentes y servicios; los componentes de UI no conocen vistas ni llaman endpoints.
3. **El backend autoriza.** Los guards y el menú previenen navegación accidental, pero nunca sustituyen permisos del servidor.
4. **Estados visibles.** Toda operación remota debe contemplar carga, datos, vacío y error.
5. **Cambios verticales completos.** Una funcionalidad nueva incluye ruta, navegación, permisos, servicio, UI, validación, pruebas y documentación aplicables.
6. **No ocultar la deuda.** Una verificación que falla se reporta como tal; no se presenta una advertencia o prueba omitida como éxito.
7. **Compatibilidad con el contrato.** Los nombres recibidos del backend se preservan o se transforman en un adaptador explícito.
8. **Accesibilidad desde el inicio.** Teclado, foco, etiquetas y nombres accesibles forman parte de la definición de terminado.

Las palabras **DEBE**, **NO DEBE** y **DEBERÍA** se usan con sentido normativo.

## 2. Arquitectura observada

### 2.1 Capas actuales

| Capa | Ubicación | Responsabilidad |
| --- | --- | --- |
| Arranque | `src/main.jsx` | Montar React, router, estilos y toaster global |
| Enrutamiento | `src/router/index.jsx` | Declarar rutas, redirecciones y guards por rol |
| Layout | `src/components/layout` | Shell autenticado: sidebar, navbar y outlet |
| Vistas | `src/views` | Orquestar casos de uso y estado de pantalla |
| Componentes comunes | `src/components/common` | Piezas reutilizables propias del negocio |
| Primitivas UI | `src/components/ui` | Componentes shadcn/Base UI sin lógica de dominio |
| Servicios | `src/services` | Traducir operaciones del dominio a HTTP |
| Cliente HTTP | `src/services/api.js` | URL base, cookies e interceptores globales |
| Estado global | `src/store/authStore.js` | Sesión y usuario compartidos/persistidos |
| Estilos y tokens | `src/index.css` | Tailwind, fuente, tema claro/oscuro y variables CSS |

### 2.2 Flujo permitido de dependencias

```text
main/router
    └── layout/views
          ├── domain/common components
          │      └── ui components + lib
          ├── services
          │      └── api.js
          └── stores
```

Reglas:

- Una vista **DEBE** llamar servicios, nunca `axios` directamente.
- Un servicio **NO DEBE** importar componentes, router ni estado visual.
- Un componente en `components/ui` **NO DEBE** conocer endpoints, roles o entidades de Prográficos.
- Un componente común **DEBERÍA** recibir datos y callbacks por props, en lugar de leer una vista concreta.
- `api.js` es el único lugar para comportamiento HTTP transversal.
- No se permiten importaciones circulares entre vistas, componentes, servicios y stores.

## 3. Organización de carpetas

### 3.1 Estructura vigente y destino de archivos nuevos

```text
src/
├── components/
│   ├── common/          # Reutilizable en dos o más dominios
│   ├── layout/          # Estructura global autenticada/pública
│   └── ui/              # Primitivas sin negocio
├── config/              # Configuración estática compartida, cuando se cree
├── hooks/               # Hooks transversales, cuando se creen
├── lib/                 # Funciones puras y adaptadores transversales
├── router/              # Tabla y utilidades de rutas
├── services/            # Un servicio por recurso/dominio remoto
├── store/               # Solo estado realmente global
└── views/
    └── <dominio>/
        ├── <Vista>.jsx
        ├── components/  # Componentes exclusivos del dominio, si crece
        ├── hooks/       # Lógica reutilizada dentro del dominio, si crece
        └── schemas/     # Esquemas Zod del dominio, si crece
```

Decisiones:

- Un archivo usado por una sola vista se mantiene junto a esa vista.
- Solo se mueve a `components/common` después de demostrar reutilización real.
- No se crea una carpeta para un único archivo sin una expectativa clara de crecimiento.
- No se añade una capa genérica (`manager`, `helper`, `processor`) si su responsabilidad puede tener un nombre de dominio preciso.
- Las primitivas agregadas mediante shadcn conservan la estructura generada y se adaptan con `cn()`.

### 3.2 Archivos heredados sin uso

`src/App.jsx`, `src/App.css`, `src/assets/react.svg` y `public/vite.svg` provienen del template. No deben usarse como ejemplo de arquitectura. Pueden eliminarse en una tarea de limpieza independiente después de comprobar que no existen referencias.

## 4. Nomenclatura

| Elemento | Regla | Ejemplo |
| --- | --- | --- |
| Componente o vista | `PascalCase.jsx` | `Orders.jsx`, `ConfirmDialog.jsx` |
| Primitiva shadcn | Nombre generado en minúscula | `button.jsx`, `dialog.jsx` |
| Hook | `use` + `PascalCase` | `useOrders`, `usePermissions` |
| Store Zustand | `camelCaseStore.js` | `authStore.js`, `orderStore.js` |
| Servicio | Sustantivo singular + `.service.js` | `user.service.js`, `order.service.js` |
| Utilidad | `camelCase.js` con funciones nombradas | `dateFormatters.js` |
| Variable/función | `camelCase` | `currentUser`, `fetchOrders` |
| Booleano | Prefijo `is`, `has`, `can` o `should` | `isLoading`, `hasRole`, `canDelete` |
| Handler | Prefijo `handle` | `handleSubmit`, `handleDeleteClick` |
| Callback prop | Prefijo `on` | `onClose`, `onSuccess` |
| Constante de módulo | Nombre descriptivo; mayúsculas si es inmutable global | `ROLE_CONFIG`, `menuItems` local |
| Rol/estado de API | `UPPER_SNAKE_CASE` según backend | `SUPERVISOR`, `EN_PROCESO` |
| Ruta web | Español, minúsculas, plural y kebab-case | `/ordenes`, `/admin/tipos-de-papel` |

Notas de compatibilidad:

- `orders.service.js` no sigue la convención singular. Si se renombra, el cambio debe actualizar todas las importaciones en el mismo commit.
- `surename` parece una grafía heredada del contrato del backend. No se cambia unilateralmente a `surname`; se puede mapear en el límite HTTP cuando el backend acuerde la migración.
- `/admin/medidad` y `/admin/tipos_de_papel` no cumplen la convención. Las rutas definitivas deberían ser `/admin/medidas` y `/admin/tipos-de-papel`, con una redirección temporal si ya existen enlaces externos.

## 5. Importaciones y módulos

- Usar `@/` para importaciones que cruzan carpetas principales de `src`.
- Usar rutas relativas cortas para archivos hermanos del mismo dominio, por ejemplo `./UserForm`.
- Orden recomendado: React/librerías, alias internos, relativos internos, estilos.
- No importar desde índices genéricos si eso introduce ciclos o dificulta el tree shaking.
- Todo módulo debe usar exports consistentes. Las vistas actuales usan `default`; las primitivas UI usan exports nombrados. Mantener esa distinción hasta una migración acordada.
- No silenciar `react-refresh/only-export-components` globalmente para resolver un solo archivo. Extraer constantes o helpers cuando corresponda.

Ejemplo:

```jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import orderService from "@/services/order.service";

import OrderFilters from "./components/OrderFilters";
```

## 6. Componentes y vistas

### 6.1 Componentes

Un componente **DEBE**:

- Tener una responsabilidad identificable.
- Recibir datos mediante props y emitir eventos mediante callbacks.
- Mantener el estado lo más cerca posible de donde se usa.
- Tener `key` estable basada en identidad de dominio, nunca en el índice si la colección puede cambiar.
- Mostrar nombres accesibles para botones de solo icono mediante `aria-label` o texto para lector de pantalla.
- Evitar efectos para valores que pueden derivarse durante el render.

Un componente **NO DEBE**:

- Duplicar validación o configuración que ya tiene una fuente compartida.
- Inyectar bloques `<style>` en cada instancia. Las animaciones compartidas van en `index.css` o en utilidades Tailwind.
- Mezclar una operación destructiva con `window.confirm` si existe `ConfirmDialog`.
- Usar colores de marca hardcodeados nuevos como `#13529a`; debe consumir un token semántico.

### 6.2 Vistas

Una vista puede coordinar carga, filtros, modales y navegación. Si supera aproximadamente 250 líneas o contiene más de un bloque reutilizable, se debe evaluar extraer:

- Tabla o lista del dominio.
- Barra de filtros.
- Formulario/modal.
- Hook de consulta y mutaciones.
- Configuración de etiquetas, roles o estados.

La extracción debe mejorar cohesión; el número de líneas por sí solo no justifica fragmentar.

## 7. Rutas, menú y permisos

### 7.1 Reglas

- Toda ruta navegable **DEBE** estar registrada antes de aparecer en `Sidebar` o en un botón.
- Ruta, etiqueta, icono y roles **DEBERÍAN** proceder de una configuración compartida para evitar divergencias.
- Las URLs nuevas usan español y kebab-case.
- Las rutas hijas usan segmentos relativos cuando están dentro de un layout padre.
- Un wildcard no debe ocultar rutas rotas enviando silenciosamente al login; se recomienda una vista `NotFound` separada.
- `ProtectedRoute` controla acceso visual, pero el backend debe validar el mismo rol para cada endpoint.
- Ocultar una opción del menú no equivale a autorizar ni desautorizar.
- Al agregar o cambiar un rol se revisan, en el mismo cambio: router, navegación, acciones visibles, formularios, pruebas y backend.

### 7.2 Patrón recomendado

Centralizar paths evita mezclar `/ordenes` y `/orders`:

```js
export const ROUTES = Object.freeze({
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  ORDERS: "/ordenes",
  ORDER_CREATE: "/ordenes/nueva",
  USERS: "/admin/usuarios",
});
```

No se debe registrar una vista vacía solo para que el enlace “funcione”. Una funcionalidad incompleta se oculta mediante una bandera explícita o no se publica en el menú.

### 7.3 Matriz de navegación actual

| Módulo | ADMIN | SUPERVISOR | EMPLOYEE | USER |
| --- | :---: | :---: | :---: | :---: |
| Dashboard | Sí | Sí | Sí | Sí |
| Órdenes | Sí | Sí | Sí | No |
| Usuarios | Sí | Sí | No | No |
| Procesos (menú pendiente) | Sí | No | No | No |
| Otros catálogos del menú | Sí | Sí | No | No |

## 8. Comunicación con el backend

### 8.1 Cliente HTTP

- Todas las peticiones usan `src/services/api.js`.
- `baseURL` se obtiene de `VITE_API_URL`.
- `withCredentials: true` se conserva mientras la sesión dependa de cookies.
- Los interceptores se reservan para preocupaciones globales: sesión expirada, permisos, trazabilidad y normalización transversal.
- Los errores de negocio se manejan en la vista o hook que conoce el contexto.
- No registrar credenciales, cookies, cuerpos sensibles ni respuestas completas en consola.

### 8.2 Servicios

Cada servicio representa un recurso o caso de uso remoto y oculta la forma de Axios. El estándar objetivo es devolver datos de dominio normalizados, no obligar a cada vista a conocer niveles variables como `data`, `data.data` o `data.data.user`.

```js
const orderService = {
  getAll: async () => {
    const { data } = await api.get("/order");
    return data.data ?? [];
  },
};
```

Reglas:

- Los endpoints se definen solo en servicios.
- Los identificadores interpolados deben validarse y, si no son numéricos, codificarse con `encodeURIComponent`.
- La forma de respuesta se normaliza en el servicio.
- Los métodos usan verbos del caso de uso: `getAll`, `getById`, `create`, `update`, `remove`, `markAsFinished`.
- No asumir que una propiedad anidada siempre existe; el estado vacío o contrato inválido debe manejarse de forma explícita.
- Cambios en endpoint, payload o respuesta requieren actualizar documentación y consumidores en el mismo PR.

### 8.3 Errores y concurrencia

- Un error debe mostrar un mensaje útil sin exponer detalles internos del servidor.
- Una mutación deshabilita el control que la dispara mientras está pendiente.
- Evitar solicitudes duplicadas por doble clic.
- Los efectos de carga deben cancelar o ignorar respuestas obsoletas al desmontar/cambiar filtros.
- No usar un `catch (error)` si `error` no se consume; usar `catch` para cumplir ESLint.
- Los `401` limpian la sesión. Los `403` muestran acceso denegado. Otros estados conservan el contexto de la pantalla.

## 9. Estado

Usar estado local para:

- Campos de formulario.
- Modal abierto/cerrado.
- Filtros de una pantalla.
- Carga y error de una única vista.

Usar Zustand únicamente para:

- Sesión/usuario compartido.
- Preferencias globales persistentes.
- Estado usado por varias rutas sin un dueño superior claro.

Reglas de sesión:

- No guardar tokens de autenticación en `localStorage`.
- Si la cookie es la autoridad de sesión, revalidar `/auth/profile` al iniciar antes de confiar en el usuario persistido.
- Persistir solo los campos necesarios mediante `partialize` y versionar el store si cambia su forma.
- `logout` debe limpiar todo estado privado relacionado con el usuario.
- `hasRole` o una utilidad equivalente debe reutilizarse en lugar de comparaciones dispersas cuando la lógica crezca.

## 10. Formularios y validación

- Formularios con reglas múltiples o reutilizables **DEBERÍAN** usar React Hook Form y Zod, ya instalados.
- La validación del cliente mejora UX; el backend sigue validando y autorizando.
- Cada campo tiene `id`, `name`, `Label htmlFor`, autocomplete apropiado y mensaje asociado.
- Usar `aria-invalid` y `aria-describedby` cuando exista error.
- Limpiar el error de un campo cuando el usuario lo corrige, sin borrar errores ajenos.
- En edición, omitir campos opcionales vacíos solo si el contrato lo define así.
- El submit debe ser idempotente desde la UI: deshabilitado mientras guarda.
- Los nombres de campos de API se mapean en un adaptador si difieren del lenguaje de presentación.

## 11. Diseño, Tailwind y responsividad

### 11.1 Tokens

`src/index.css` es la fuente de tokens. Para ampliar el diseño:

- Crear tokens semánticos (`primary`, `destructive`, `muted`, `sidebar`) y consumir clases asociadas.
- No introducir nuevos hexadecimales de marca repetidos en JSX.
- Mantener contraste suficiente en texto, foco, hover y estados deshabilitados.
- Verificar tema oscuro si se modifica una primitiva que ya usa variables `dark`.
- Usar `cn()` para combinar clases condicionales y resolver conflictos Tailwind.

El azul `#13529a` está repetido en componentes actuales. Debe migrarse a un token de marca en una tarea separada; mientras tanto no se deben añadir más variantes hardcodeadas.

### 11.2 Responsividad

- Diseñar primero el ancho pequeño y ampliar con breakpoints.
- Las grillas de formulario deben usar una columna en móvil y dos cuando exista espacio.
- El sidebar fijo debe evolucionar a drawer en pantallas pequeñas.
- Las tablas conservan scroll horizontal, pero las acciones importantes deben seguir siendo alcanzables.
- Probar al menos 360 px, 768 px y un escritorio de 1280 px.

### 11.3 Estados visuales

Cada vista remota incluye:

- Skeleton o indicador de carga.
- Estado vacío con texto accionable.
- Error recuperable y opción de reintentar cuando aplique.
- Confirmación consistente para operaciones destructivas.
- Feedback de éxito o error con Sonner.

## 12. Accesibilidad

- Todos los flujos deben poder operarse con teclado.
- Los modales requieren foco inicial, trampa de foco, cierre con Escape y devolución del foco al disparador. Preferir la primitiva `Dialog` de Base UI frente a modales manuales.
- Un backdrop clickeable no sustituye un botón de cierre accesible.
- Botones con solo icono llevan `aria-label`.
- Las imágenes llevan `alt` contextual; un avatar decorativo puede usar texto alternativo vacío si el nombre ya está visible.
- No comunicar estado únicamente mediante color; incluir texto o icono con nombre accesible.
- Respetar `prefers-reduced-motion` para animaciones no esenciales.
- El idioma de `index.html` debe coincidir con la interfaz (`lang="es"`).

## 13. Seguridad y configuración

- Ningún secreto entra en el bundle ni en Git.
- `.env` debe estar ignorado; `.env.example` debe estar versionado con nombres y valores no sensibles.
- Si un secreto estuvo versionado, eliminar el archivo en el commit actual no basta: se debe rotar el secreto y evaluar la limpieza del historial.
- Las variables `VITE_*` son públicas para quien descarga la aplicación.
- La cookie de sesión debe configurarse en backend con `HttpOnly`, `Secure` y `SameSite` acordes al despliegue.
- CORS debe permitir el origen exacto y credenciales; no usar `*` junto con cookies.
- Los permisos se verifican de nuevo en backend para cada operación.
- Las URLs de avatar u otros recursos remotos requieren una política de orígenes/CSP definida antes de producción.
- No renderizar HTML del servidor mediante `dangerouslySetInnerHTML` sin sanitización explícita.

### Configuración actual que debe corregirse

El repositorio tiene `.env` versionado y `.env.example` sin seguimiento. La migración recomendada, desde la raíz del frontend y después de revisar que ningún valor de ejemplo sea sensible, es:

```powershell
cd C:\Users\juanp\Desktop\PROGRAFICOS\frontend-prograficos
# Agregar .env a .gitignore antes de ejecutar el siguiente comando.
git rm --cached .env
git add .env.example .gitignore
```

No ejecutar esa migración en medio de una funcionalidad sin informar al equipo, porque afecta el proceso de despliegue.

## 14. Rendimiento

- Las vistas de ruta deberían cargarse con `lazy()`/`Suspense` cuando aumente el número de módulos.
- Evitar importar librerías completas si existe un entry point específico.
- No memoizar por costumbre; medir antes y después.
- Paginar o virtualizar colecciones que puedan crecer significativamente.
- Evitar refetch completo después de una mutación si la respuesta permite actualizar la caché local con seguridad.
- Imágenes externas deben tener dimensiones, fallback y estrategia de carga.
- Revisar el warning de chunks en cada build; el bundle actual supera 500 kB antes de gzip.

## 15. Pruebas

El proyecto no tiene pruebas automatizadas configuradas. La recomendación es incorporar Vitest, React Testing Library y Mock Service Worker en una tarea dedicada.

Cuando exista el stack de pruebas:

- Funciones puras, adaptadores y validaciones: pruebas unitarias.
- Vistas: carga, vacío, error y éxito.
- Guards: usuario anónimo y cada rol relevante.
- Formularios: validación, envío, error de backend y doble clic.
- Servicios: endpoint, método, payload y normalización.
- Flujos críticos: login, sesión expirada, usuarios y órdenes.

Mientras no exista automatización, cada PR debe documentar pruebas manuales realizadas. “Abre en mi navegador” no es evidencia suficiente: registrar ruta, rol, escenario y resultado.

## 16. ESLint, formato y calidad

Antes de entregar:

```powershell
cd C:\Users\juanp\Desktop\PROGRAFICOS\frontend-prograficos
npm run lint
npm run build
```

Reglas:

- No agregar nuevas advertencias.
- No usar comentarios `eslint-disable` sin explicación local y alcance mínimo.
- Corregir dependencias de hooks; no desactivar `exhaustive-deps` por defecto.
- Los `useEffect` deben declarar dependencias estables o mover la función dentro del efecto.
- Eliminar imports, variables y bloques comentados obsoletos.
- Mantener el estilo dominante: comillas dobles y punto y coma en código propio. Los archivos generados por shadcn pueden conservar su formato hasta aplicar un formateador global.
- Introducir Prettier solo mediante un cambio de configuración aislado, evitando mezclar un reformateo masivo con lógica funcional.

## 17. Git y revisión

El historial existente usa Conventional Commits. Mantener:

```text
feat: add order creation flow
fix: align order detail route with router
docs: document authentication contract
refactor: centralize route constants
test: cover protected route roles
chore: update lint configuration
```

Un commit debe ser coherente y revisable. No mezclar:

- Funcionalidad y reformateo masivo.
- Corrección de bug y actualización indiscriminada de dependencias.
- Cambio de contrato frontend sin su ajuste coordinado de backend/documentación.

La descripción del PR debe incluir propósito, alcance, rutas/roles afectados, evidencia visual si cambia UI, verificaciones ejecutadas, variables/migraciones y deuda que queda fuera.

## 18. Proceso para agregar una funcionalidad

Ejemplo: implementar creación de órdenes.

1. Confirmar endpoint, payload, respuesta, errores y roles con el backend.
2. Definir paths españoles (`/ordenes/nueva`) en una constante compartida.
3. Registrar la ruta bajo el `ProtectedRoute` correcto.
4. Añadir navegación solo cuando la vista sea utilizable.
5. Implementar/ajustar `order.service.js` y normalizar respuestas.
6. Crear schema de formulario y UI accesible/responsiva.
7. Manejar carga, envío, éxito, error y salida con cambios sin guardar.
8. Probar acceso directo por URL con todos los roles relevantes.
9. Ejecutar lint, pruebas disponibles y build.
10. Actualizar README/guía si cambia ruta, variable, rol o contrato.

## 19. Definición de terminado

Una tarea se considera terminada cuando:

- [ ] El comportamiento satisface el caso de uso y el contrato confirmado.
- [ ] Ruta, menú y roles coinciden.
- [ ] El backend sigue siendo la autoridad de permisos.
- [ ] Existen estados de carga, vacío, éxito y error aplicables.
- [ ] La UI funciona con teclado y tiene etiquetas accesibles.
- [ ] La vista es usable en móvil, tableta y escritorio.
- [ ] No se añadieron secretos ni variables públicas sensibles.
- [ ] `npm run lint` pasa o se documentan con precisión fallas preexistentes sin añadir nuevas.
- [ ] `npm run build` pasa.
- [ ] Las pruebas automatizadas pasan; si no existen, se registraron pruebas manuales reproducibles.
- [ ] Se actualizaron rutas, endpoints, variables y decisiones documentadas.
- [ ] No quedaron imports, logs, comentarios ni archivos temporales innecesarios.

## 20. Deuda técnica priorizada

Este inventario describe el estado encontrado; no implica que los puntos estén corregidos.

| Prioridad | Hallazgo | Evidencia/impacto | Acción sugerida |
| --- | --- | --- | --- |
| P0 | Enlaces sin ruta | El sidebar publica siete paths no registrados | Ocultar módulos pendientes o implementar ruta, vista y permisos completos |
| P0 | URLs rotas de órdenes | Los botones usan `/orders/...`; la aplicación registra `/ordenes` | Definir constantes y crear rutas españolas coherentes |
| P0 | Configuración local versionada | `.env` está en Git y `.env.example` no | Ignorar/desindexar `.env`, versionar el ejemplo y rotar cualquier secreto si existiera |
| P1 | Lint en rojo | 8 errores y 1 warning al ejecutar `npm run lint` | Resolver variables no usadas, exports de Fast Refresh, globals de Vite config y dependencias del efecto |
| P1 | Sesión persistida sin revalidación | Existe `authService.profile`, pero el arranque confía en `localStorage` | Añadir bootstrap de sesión con estado `checking` antes de renderizar guards |
| P1 | Permisos y rutas duplicados | Router y `menuItems` mantienen roles por separado | Centralizar metadatos de navegación y permisos |
| P1 | Accesibilidad de modales/acciones | Hay modales manuales y botones de icono sin nombre accesible | Adoptar `Dialog`, foco completo y `aria-label` |
| P1 | Responsividad limitada | Sidebar fijo y grillas de formulario de dos columnas | Implementar drawer móvil y breakpoints de formularios |
| P2 | Respuestas API inconsistentes | Las vistas consumen `data`, `data.data` y `data.data.user` | Normalizar dentro de servicios |
| P2 | Bundle monolítico | Build produce un chunk JS de ~563 kB | Lazy-load por ruta y analizar dependencias |
| P2 | Docker orientado a desarrollo | Usa `npm install` y ejecuta Vite dev server | Crear build multietapa reproducible y servidor de estáticos |
| P2 | Componentes/vistas extensos | Sidebar, Users y UserForm concentran varias responsabilidades | Extraer configuración, tabla, formulario y hooks por dominio |
| P2 | Colores y animaciones duplicados | Azul hexadecimal y `<style>` se repiten | Crear tokens y animaciones globales |
| P2 | Sin pruebas automatizadas | No existe script `test` | Incorporar Vitest/RTL/MSW y cubrir flujos críticos |
| P3 | Residuos del template | App, CSS e iconos de Vite no se usan | Eliminar en un commit de limpieza verificado |
| P3 | Dependencias locales extrañas | El `node_modules` inspeccionado contenía paquetes no declarados | Usar `npm ci`; no versionar ni reutilizar instalaciones contaminadas |

### Línea base de verificación

Al momento de redactar esta guía:

- `npm run build`: correcto con advertencia de tamaño de chunk.
- `npm run lint`: 8 errores y 1 advertencia.
- Pruebas: no hay comando configurado.

Actualizar esta sección cuando la línea base cambie; no conservar cifras históricas como si fueran el estado actual.
