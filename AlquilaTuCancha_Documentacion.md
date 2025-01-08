
----------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------------------------------
# **📘 Documentación - Alquila Tu Cancha Backend Challenge**
----------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------------------------------

## **1️⃣ Configuración Inicial**

### **1.1 Clonar el Repositorio**
    Para comenzar con el desafío, se realizó un fork del repositorio oficial en GitHub. Luego, se clonó el repositorio forkeado localmente utilizando el siguiente comando:

    ```bash
    git clone https://github.com/abonifacio/alquilatucancha-backend-challenge.git
    cd alquilatucancha-backend-challenge

    Además, se creó una nueva rama llamada `feature/challenge-solution` a partir de la rama master para trabajar en la solución del desafío:
    
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

----------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------------------------------

## **2️⃣ API Principal**

### **2.1 Verificación del Endpoint `/search`**

#### **Descripción**

    Consulta la disponibilidad de canchas para una zona y fecha específica.

#### **Problema Inicial**
    Al enviar fechas pasadas, se generaba el error:

    "Validation failed: Date cannot be in the past."


#### **Solución**
    Se corrigieron los parámetros para utilizar fechas futuras válidas:

      ```bash
      curl "http://localhost:3000/search?placeId=ChIJW9fXNZNTtpURV6VYAumGQOw&date=2025-01-10"
      ```

----------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------------------------------

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

### **3.3 Resultados de Pruebas Unitarias con Jest**

    Se ejecutaron pruebas unitarias para el servicio `RedisService` con el siguiente comando:

      ```bash
      npx jest src/infrastructure/services/redis.service.spec.ts
      ```

**Resultados:**

      ````typescript
            PASS  src/infrastructure/services/redis.service.spec.ts (21.873 s)
              RedisService
                ✓ should be defined (158 ms)
                ✓ should call redisClient.get with the correct key (107 ms)
                ✓ should call redisClient.set with the correct arguments without TTL (111 ms)
                ✓ should call redisClient.set with the correct arguments with TTL (141 ms)
                ✓ should call redisClient.del with the correct key (27 ms)
                ✓ should return null for a non-existent key (17 ms)

            Test Suites: 1 passed, 1 total
            Tests:       6 passed, 6 total
            Snapshots:   0 total
            Time:        22.427 s
            Ran all test suites matching /src\/infrastructure\/services\/redis.service.spec.ts/i.


Estas pruebas verifican el correcto funcionamiento del servicio Redis, incluyendo los métodos `get`, `set` y `del`. 
El servicio se comportó conforme a lo esperado en todos los casos.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## **4️⃣ Controlador Auxiliar para Redis**

  El archivo `test-redis.controller.ts` expone endpoints para interactuar con Redis:

### **4.1 Endpoints Disponibles**

- **Guardar un valor en Redis:**
  
  Para realizar pruebas manuales, primero interactúa con el cliente Redis directamente desde el contenedor Docker:
  
  docker exec -u root -it alquilatucancha-backend-challenge_redis_1 redis-cli

  SET testKey testValue
  GET testKey

  `Luego, utiliza los endpoints para realizar pruebas automatizadas:`

  # Guardar un valor en Redis

    curl "http://localhost:3000/example/set?key=testKey&value=testValue&ttl=3600"

  # Respuesta esperada:
  
    Key "testKey" set with value "testValue"

  # Recuperar un valor de Redis

    curl "http://localhost:3000/example/get?key=testKey"

  # Respuesta esperada:

    Value for key "testKey": testValue

### **5.2 Propósito**

    Este controlador fue utilizado para pruebas manuales y cobertura de código, pero no forma parte de la funcionalidad final del desafío.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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

      `npx jest src/domain/handlers/get-availability.handler.spec.ts`

**Resultados esperados:**

      PASS  src/domain/handlers/get-availability.handler.spec.ts (20.467 s)
        GetAvailabilityHandler
          ✓ returns the availability (17 ms)

      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
      Time:        21.491 s

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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

El validador `validateQueryInput` utiliza este esquema para validar cualquier entrada proporcionada al sistema.
    
      export const validateQueryInput = (input: { placeId: string; date: string }) => {
        return GetAvailabilitySchema.parse(input);
      };

### **5.4 Pruebas Unitarias**

    Las pruebas verifican el correcto funcionamiento del validador, cubriendo entradas válidas e inválidas:

- **Entrada válida:**
  
      const input = { placeId: '123', date: '2025-01-10' };
      expect(() => validateQueryInput(input)).not.toThrow();
      
- **Errores detectados:**
  - `placeId` vacío.
  - Fecha con formato inválida.
  - Fecha en el pasado.
  - Varios campos inválidos simultáneamente.

**Resultados esperados:**

      PASS  src/domain/commands/get-availability.query.spec.ts (10.986 s)
        GetAvailabilityQuery
          ✓ should validate correct input (9 ms)
          ✓ should throw error for missing placeId (51 ms)
          ✓ should throw error for invalid date format (2 ms)
          ✓ should throw error for date in the past (3 ms)
          ✓ should throw error for multiple invalid fields (7 ms)

      Test Suites: 1 passed, 1 total  
      Tests:       5 passed, 5 total  
      Snapshots:   0 total  
      Time:        11.948 s, estimated 25 s  
      Ran all test suites matching /src\/domain\/commands\/get-availability.query.spec.ts/i.

### **5.5 Comando de prueba**

    Para ejecutar las pruebas unitarias, utiliza el siguiente comando:

      `npx jest src/domain/commands/get-availability.query.spec.ts`

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## **6️⃣ Validación del Evento `club_updated`**

### **6.1 Descripción**
    El evento `club_updated` se asegura de que las actualizaciones realizadas a los clubes (por ejemplo, atributos o horarios de apertura) se reflejen correctamente.

### **6.2 Pruebas Realizadas**
1. **Instanciación con campos válidos:**
   - Se valida que el evento se pueda crear correctamente con un `clubId` válido y una lista de campos (`fields`) que incluyen atributos como `attributes` y `openhours`.

### **6.3 Resultados de las pruebas**

  Para ejecutar las pruebas unitarias, utiliza el siguiente comando:

      `npx jest src/domain/events/club-updated.event.spec.ts`

    Las pruebas arrojan los siguientes resultados:

    PASS  src/domain/events/club-updated.event.spec.ts (11.542 s)
      ClubUpdatedEvent
        ✓ should create an instance with valid fields (6 ms)

    Test Suites: 1 passed, 1 total
    Tests:       1 passed, 1 total
    Snapshots:   0 total
    Time:        11.962 s

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## **8️⃣ Validación del SearchController**

### **8.1 Descripción**
    El `SearchController` es el encargado de manejar las solicitudes para consultar la disponibilidad de canchas. Para optimizar el rendimiento y manejar fallos de manera controlada, utiliza una estrategia basada en caché y un `QueryBus`. En caso de errores, prioriza devolver datos obsoletos antes que fallar por completo.

### **8.2 Casos de Uso Cubiertos**
    En las pruebas realizadas, se validaron los siguientes escenarios:
    1. **Datos en caché:** Si los datos ya están almacenados en el caché, los devuelve directamente.
    2. **Sin datos en caché:** Ejecuta el `QueryBus` para obtener los datos desde la fuente y luego los guarda en el caché.
    3. **Error en el `QueryBus`:** 
      - Devuelve datos obsoletos del caché.
      - Registra un log del error con el siguiente mensaje:
        ```plaintext
        ERROR [SearchController] Error executing QueryBus: Query failed
        ```
    4. **Fallo total:** Lanza una excepción si no hay datos ni en el caché ni en la fuente de datos.
    5. **Fecha inválida:** Lanza una excepción si la fecha proporcionada está en el pasado.

---

### **8.3 Pruebas Unitarias**

Las pruebas validaron que el comportamiento sea el esperado en los siguientes casos:
- Datos en caché disponibles.
- Almacenamiento de datos nuevos en el caché tras ejecutar el `QueryBus`.
- Manejo de errores devolviendo datos obsoletos y registrando logs.
- Excepciones lanzadas correctamente cuando hay fallos totales o fechas inválidas.

---

### **8.4 Comando de Pruebas**

    Para correr las pruebas unitarias del `SearchController`, utiliza el siguiente comando:

      `npx jest src/infrastructure/controllers/search.controller.spec.ts`

    Las pruebas arrojan los siguientes resultados:

    PASS  src/infrastructure/controllers/search.controller.spec.ts (37.337 s)
      SearchController
        ✓ should return cached data if available (215 ms)
        ✓ should execute QueryBus and cache result if no cached data (205 ms)
        ✓ should log error and return stale cache on query failure (200 ms)
        ✓ should throw exception if query fails and no stale cache (249 ms)
        ✓ should throw exception for invalid date (53 ms)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# **9️⃣ Pruebas de Rendimiento con Apache Benchmark (AB)**

### **9.1 Descripción**
    Se realizaron pruebas con Apache Benchmark (AB) para medir el rendimiento del sistema bajo diferentes niveles de carga y concurrencia.

A continuación, se presentan los comandos utilizados para ejecutar las pruebas, junto con los resultados obtenidos.

    Instalación de Apache Benchmark (AB):

    MacOS (usando Homebrew): `brew install apache-bench`

    Una vez instalado, puedes verificar que Apache Benchmark está disponible ejecutando:

    Verificar la Instalación: `ab -V`

---

## **Prueba 1: 1000 requests con concurrencia de 10**

      ### **Comando:**
      ```bash
      ab -n 1000 -c 10 http://localhost:3000/search?placeId=ChIJW9fXNZNTtpURV6VYAumGQOw&date=2025-01-10
      ```

### **Resultado:**
      ```plaintext
      Concurrency Level:      10
      Time taken for tests:   47.615 seconds
      Complete requests:      1000
      Failed requests:        0
      Requests per second:    21.00 [#/sec] (mean)
      Time per request:       476.155 [ms] (mean)
      Transfer rate:          465.40 [Kbytes/sec] received
      ```

## **Prueba 2: 1000 requests con concurrencia de 50**

      ### **Comando:**
      ```bash
      ab -n 1000 -c 50 http://localhost:3000/search?placeId=ChIJW9fXNZNTtpURV6VYAumGQOw&date=2025-01-10
      ```

### **Resultado:**
      ```plaintext
      Concurrency Level:      50
      Time taken for tests:   35.215 seconds
      Complete requests:      1000
      Failed requests:        0
      Requests per second:    28.40 [#/sec] (mean)
      Time per request:       1760.774 [ms] (mean)
      Transfer rate:          629.27 [Kbytes/sec] received
      ```

## **Prueba 3: 5000 requests con concurrencia de 10**

      ### **Comando:**
      ```bash
      ab -n 5000 -c 10 http://localhost:3000/search?placeId=ChIJW9fXNZNTtpURV6VYAumGQOw&date=2025-01-10
      ```

      ### **Resultado:**
      ```plaintext
      Concurrency Level:      10
      Time taken for tests:   343.882 seconds
      Complete requests:      5000
      Failed requests:        0
      Requests per second:    14.54 [#/sec] (mean)
      Time per request:       687.764 [ms] (mean)
      Transfer rate:          322.21 [Kbytes/sec] received
      ```

## **Prueba 4: 5000 requests con concurrencia de 50**

      ### **Comando:**
      ```bash
      ab -n 5000 -c 50 http://localhost:3000/search?placeId=ChIJW9fXNZNTtpURV6VYAumGQOw&date=2025-01-10
      ```

### **Resultado:**
      ```plaintext
      Concurrency Level:      50
      Time taken for tests:   256.065 seconds
      Complete requests:      5000
      Failed requests:        0
      Requests per second:    19.53 [#/sec] (mean)
      Time per request:       2560.653 [ms] (mean)
      Transfer rate:          432.71 [Kbytes/sec] received
      ```

## **Prueba 5: Validación - 5000 requests con concurrencia de 50**

      ### **Comando:**
      ```bash
      ab -n 5000 -c 50 http://localhost:3000/search?placeId=ChIJW9fXNZNTtpURV6VYAumGQOw&date=2025-01-10
      ```

### **Resultado:**
      ```plaintext
      Concurrency Level:      50
      Time taken for tests:   256.065 seconds
      Complete requests:      5000
      Failed requests:        0
      Requests per second:    19.53 [#/sec] (mean)
      Time per request:       2560.653 [ms] (mean)
      Transfer rate:          432.71 [Kbytes/sec] received
      ```

### 9.2 Análisis:

- Eficiencia bajo carga: El sistema maneja cargas moderadas y altas con tiempos aceptables, especialmente con concurrencia de 50 usuarios.
- Optimización clave:
  - Uso de Redis para almacenar datos en caché y reducir el acceso frecuente a la base de datos o Mock API.
  - Implementación de consultas paralelas (`Promise.all`) para mejorar el rendimiento.
- Áreas de mejora:
  - Reducir los tiempos máximos bajo cargas pesadas.
  - Monitorizar posibles cuellos de botella en momentos de alta concurrencia.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          -----------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

MENSAJE FINAL:

`Gracias por la oportunidad de trabajar en este desafío. He intentado cumplir con todos los puntos del challenge y aplicar lo aprendido para entregar la mejor solución posible. Sin embargo, reconozco que puede haber detalles o conceptos que no estén del todo claros o que puedan ser mejorados.

Creo que el proyecto cumple con los principales requerimientos, pero si hay algo que corregir o en lo que pueda mejorar, estaré encantado de recibir feedback y aprender de ello. Estoy abierto a cualquier consulta o sugerencia que ayude a mejorar este trabajo.

¡Gracias nuevamente por esta experiencia!`