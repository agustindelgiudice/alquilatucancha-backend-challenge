import { config } from 'dotenv'; // Importa dotenv para manejar variables de entorno
config(); // Carga las variables desde el archivo .env

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module';

async function bootstrap() {
  // Lee el puerto desde los argumentos de línea de comandos, variables de entorno o usa 3000 por defecto
  const args = process.argv.slice(2);
  const portArg = args.find(arg => arg.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : parseInt(process.env.PORT || '3000', 10);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
