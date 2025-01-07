
# **📘 Documentación - Alquila Tu Cancha Backend Challenge**

## **1️⃣ Configuración Inicial**

### **1.1 Clonar el Repositorio**
Para comenzar con el desafío, se clonó el repositorio oficial utilizando el siguiente comando:

```bash
git clone https://github.com/abonifacio/alquilatucancha-backend-challenge.git
cd alquilatucancha-backend-challenge
```

### **1.2 Instalar Dependencias**
Se instalaron las dependencias necesarias del proyecto con:

```bash
yarn
```

### **1.3 Configuración del Archivo `.env`**
Se creó un archivo `.env` en la raíz del proyecto con las siguientes configuraciones:

```plaintext
EVENT_INTERVAL_SECONDS=10
REQUESTS_PER_MINUTE=60
EVENT_PUBLISHER_URL=http://api:3000/events
PORT=4000
REDIS_HOST=redis
REDIS_PORT=6379
```

#### **Propósito:**
- `EVENT_INTERVAL_SECONDS`: Frecuencia de eventos generados.
- `REQUESTS_PER_MINUTE`: Límite de solicitudes por minuto.
- Configuración de Redis (`REDIS_HOST`, `REDIS_PORT`).
- URL de la Mock API (`EVENT_PUBLISHER_URL`).

### **1.4 Levantar los Servicios**
Inicialización del proyecto con Docker Compose:

```bash
docker-compose up --build
```

Verificación de servicios activos:

```bash
docker ps
```

### **1.5 Prueba de la Mock API**
Validación del funcionamiento:

```bash
curl http://localhost:4000/zones
```

**Resultado esperado:** Una lista de zonas disponibles, incluyendo `placeId`.

---

## **2️⃣ API Principal**

### **2.1 Verificación del Endpoint `/search`**

#### **Descripción**
Consulta la disponibilidad de canchas para una zona y fecha específica.

#### **Problema Inicial**
Al enviar fechas pasadas, se generaba el error:
```plaintext
Validation failed: Date cannot be in the past.
```

#### **Solución**
Se corrigieron los parámetros para utilizar fechas futuras válidas:

```bash
curl "http://localhost:3000/search?placeId=ChIJW9fXNZNTtpURV6VYAumGQOw&date=2025-01-10"
```

---

## **3️⃣ Implementación de Redis**

### **3.1 Descripción**
Redis se utilizó como sistema de caché para optimizar las consultas.

#### **Beneficios:**
- Respuestas más rápidas gracias a datos en caché.
- Reducción de solicitudes a la Mock API.

### **3.2 Pruebas Unitarias**
Validaciones realizadas sobre Redis:
1. **`get`**: Recuperación de datos del caché.
2. **`set`**: Almacenamiento de datos con TTL.
3. **`delete`**: Eliminación de datos.

Comando para ejecutar las pruebas:

```bash
yarn test redis.service.spec.ts
```

---

## **4️⃣ Optimización del Handler `GetAvailabilityHandler`**

### **4.1 Cambios Realizados**
1. **Caché**: Uso de claves en formato `availability:{placeId}:{date}`.
2. **Código Refactorizado**: Consultas en paralelo con `Promise.all`.

### **4.2 Pruebas Unitarias**
Casos cubiertos:
- Sin clubes disponibles.
- Canchas vacías o con horarios.
- Errores al consultar clubes.

Comando de pruebas:

```bash
npx jest src/domain/handlers/get-availability.handler.spec.ts
```

---

# **5️⃣ Validación de Parámetros - Comando `GetAvailabilityQuery`**

### **5.1 Validaciones**
El esquema definido para validar los parámetros de entrada (`placeId` y `date`) asegura lo siguiente:

- **`placeId`**: 
  - No puede estar vacío.
  - Debe contener un valor válido sin espacios en blanco.

- **`date`**: 
  - Debe seguir el formato `YYYY-MM-DD`.
  - Debe ser una fecha futura.

Si alguno de los campos no cumple con estas validaciones, se lanza un error del tipo `ZodError`.

### **5.2 Transformaciones**
El campo `date` no solo se valida, sino que también se transforma a un objeto `Date` en el proceso del query cuando se instancia la clase `GetAvailabilityQuery`. Esto asegura que las fechas se manejen en un formato estándar dentro del sistema.

### **5.3 Implementación del esquema**
El esquema se define utilizando la biblioteca `nestjs-zod`:

```typescript
import { z } from 'nestjs-zod/z';

export const GetAvailabilitySchema = z.object({
  placeId: z.string().nonempty('placeId is required'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => new Date(date) > new Date(), {
      message: 'Date must be in the future',
    }),
});
```

El validador `validateQueryInput` utiliza este esquema para validar cualquier entrada proporcionada al sistema.

```typescript
export const validateQueryInput = (input: { placeId: string; date: string }) => {
  return GetAvailabilitySchema.parse(input);
};
```

### **5.4 Pruebas Unitarias**
Las pruebas verifican el correcto funcionamiento del validador, cubriendo entradas válidas e inválidas:

- **Entrada válida:**
  ```typescript
  const input = { placeId: '123', date: '2025-01-10' };
  expect(() => validateQueryInput(input)).not.toThrow();
  ```

- **Errores detectados:**
  - `placeId` vacío.
  - Fecha con formato inválido.
  - Fecha en el pasado.
  - Varios campos inválidos simultáneamente.

**Archivo de prueba:**
```typescript
import { validateQueryInput } from '../commands/get-availaiblity.query';
import { ZodError } from 'nestjs-zod/z';

describe('GetAvailabilityQuery', () => {
  it('should validate correct input', () => {
    const input = { placeId: '123', date: '2025-01-10' };
    expect(() => validateQueryInput(input)).not.toThrow();
  });

  it('should throw error for missing placeId', () => {
    const input = { placeId: '', date: '2025-01-10' };
    expect(() => validateQueryInput(input)).toThrowError(ZodError);
  });

  it('should throw error for invalid date format', () => {
    const input = { placeId: '123', date: 'invalid-date' };
    expect(() => validateQueryInput(input)).toThrowError(ZodError);
  });

  it('should throw error for date in the past', () => {
    const input = { placeId: '123', date: '2024-01-01' };
    expect(() => validateQueryInput(input)).toThrowError(ZodError);
  });

  it('should throw error for multiple invalid fields', () => {
    const input = { placeId: '', date: 'invalid-date' };
    expect(() => validateQueryInput(input)).toThrowError(ZodError);
  });
});
```

### **5.5 Comando de prueba**
Para ejecutar las pruebas unitarias, utiliza el siguiente comando:

```bash
npx jest src/domain/commands/get-availability.query.spec.ts
```

### **5.6 Resultados de las pruebas**
Las pruebas arrojan los siguientes resultados:

PASS  src/domain/commands/get-availability.query.spec.ts (16.557 s)
  GetAvailabilityQuery
    ✓ should validate correct input (72 ms)
    ✓ should throw error for missing placeId (204 ms)
    ✓ should throw error for invalid date format (15 ms)
    ✓ should throw error for date in the past (34 ms)
    ✓ should throw error for multiple invalid fields (73 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        17.528 s

## **6️⃣ Validación del Evento `club_updated`**

### **6.1 Descripción**
El evento `club_updated` se asegura de que las actualizaciones realizadas a los clubes (por ejemplo, atributos o horarios de apertura) se reflejen correctamente.

### **6.2 Pruebas Realizadas**
1. **Instanciación con campos válidos:**
   - Se valida que el evento se pueda crear correctamente con un `clubId` válido y una lista de campos (`fields`) que incluyen atributos como `attributes` y `openhours`.

### **6.3 Código del Test**
```typescript
import { ClubUpdatedEvent } from './club-updated.event';

describe('ClubUpdatedEvent', () => {
  it('should create an instance with valid fields', () => {
    // Datos de entrada
    const clubId = 1;
    const fields: ('attributes' | 'openhours')[] = ['attributes', 'openhours'];
    const event = new ClubUpdatedEvent(clubId, fields);
    
    // Validar que los valores son los correctos
    expect(event.clubId).toBe(clubId);
    expect(event.fields).toEqual(fields);
  });
});

### **5.6 Resultados de las pruebas**
Las pruebas arrojan los siguientes resultados:

➜  alquilatucancha-backend-challenge git:(feature/challenge-solution) ✗ npx jest src/domain/events/club-updated.event.spec.ts      
 PASS  src/domain/events/club-updated.event.spec.ts (11.542 s)
  ClubUpdatedEvent
    ✓ should create an instance with valid fields (6 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        11.962 s
---

## **7️⃣ Validación de Eventos del Controller**

Se verificaron los siguientes casos:
1. El controlador está correctamente definido.
2. Publicación de eventos específicos según el tipo recibido:
   - **`booking_created`**: Publica `SlotBookedEvent`.
   - **`booking_cancelled`**: Publica `SlotAvailableEvent`.
   - **`club_updated`**: Publica `ClubUpdatedEvent`.
   - **`court_updated`**: Publica `CourtUpdatedEvent`.

**7.1 Resumen del Código del Test**

El `.spec` incluye los siguientes puntos clave:
1. **Simulación del `EventBus`**:
   - Se utiliza `jest.fn()` para mockear la funcionalidad del `EventBus`.
2. **Prueba de definición del controlador**:
   - Valida que el controlador está correctamente instanciado.
3. **Recepción de eventos específicos**:
   - `receiveEvent` procesa el evento y verifica la publicación correcta mediante el `EventBus`.

**7.2 Resultados de las pruebas

Las pruebas arrojan los siguientes resultados:

 PASS  src/infrastructure/controllers/events.controller.spec.ts (13.937 s)
  EventsController
    ✓ should be defined (99 ms)
    ✓ should publish SlotBookedEvent on booking_created (56 ms)
    ✓ should publish SlotAvailableEvent on booking_cancelled (31 ms)
    ✓ should publish ClubUpdatedEvent on club_updated (35 ms)
    ✓ should publish CourtUpdatedEvent on court_updated (37 ms)
    ✓ should publish CourtUpdatedEvent on court_updated (22 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        14.293 s


---
##**8️⃣ Validación del SearchController

8.1 Pruebas Unitarias
Se verificaron los siguientes casos clave:

Datos en caché:
Retorna datos directamente del caché si están disponibles.
Sin datos en caché:
Ejecuta QueryBus y almacena el resultado en el caché.
Error en QueryBus:
Retorna datos obsoletos del caché y registra el error.
Fallo total:
Lanza una excepción si no hay datos ni en el caché ni en el obsoleto.
Fecha inválida:
Lanza una excepción si la fecha está en el pasado.

Comando de pruebas:
- npx jest src/infrastructure/controllers/search.controller.spec.ts

Las pruebas arrojan los siguientes resultados:

 PASS  src/infrastructure/controllers/search.controller.spec.ts (37.337 s)
  SearchController
    ✓ should return cached data if available (215 ms)
    ✓ should execute QueryBus and cache result if no cached data (205 ms)
    ✓ should log error and return stale cache on query failure (200 ms)
    ✓ should throw exception if query fails and no stale cache (249 ms)
    ✓ should throw exception for invalid date (53 ms)

---

9.1 Descripción
Se realizaron pruebas con Apache Benchmark (AB) para medir el rendimiento del sistema bajo diferentes niveles de carga y concurrencia.

Pruebas Realizadas
1000 requests, concurrencia 10:

Tiempo total: 39.02 segundos.
Requests por segundo: 25.63.
Tiempo promedio por request: 390.2 ms.
1000 requests, concurrencia 50:

Tiempo total: 15.15 segundos.
Requests por segundo: 66.00.
Tiempo promedio por request: 757.6 ms.
5000 requests, concurrencia 10:

Tiempo total: 96.73 segundos.
Requests por segundo: 51.69.
Tiempo promedio por request: 193.4 ms.
5000 requests, concurrencia 50:

Tiempo total: 65.66 segundos.
Requests por segundo: 76.15.
Tiempo promedio por request: 656.6 ms.
5000 requests, concurrencia 50 (otra ejecución):

Tiempo total: 87.00 segundos.
Requests por segundo: 57.47.
Tiempo promedio por request: 870.0 ms.
9.2 Análisis
Eficiencia bajo carga: El sistema maneja cargas moderadas y altas con tiempos aceptables, especialmente con concurrencia de 50 usuarios.
Optimización clave:
Uso de Redis para almacenar datos en caché y reducir el acceso frecuente a la base de datos o Mock API.
Implementación de consultas paralelas (Promise.all) para mejorar el rendimiento.
Áreas de mejora:
Reducir los tiempos máximos bajo cargas pesadas.
Monitorizar posibles cuellos de botella en momentos de alta concurrencia.

---

## **🔟 Conclusión Final**

- **Pruebas Unitarias:** Todas las pruebas relevantes pasaron.
- **Optimización:** Uso eficiente de Redis y consultas paralelas.
- **Estado del Proyecto:** Listo para entrega, cumpliendo los requerimientos técnicos.
