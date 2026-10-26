import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Rewriting /api/* prefix to /* so that both direct assessment routes
  // (/sales-orders, /vehicles, /transport-orders) and Vite proxied routes (/api/*) work seamlessly.
  app.use((req: any, _res: any, next: () => void) => {
    if (req.url.startsWith('/api/docs')) {
      // Keep Swagger accessible
      next();
    } else if (req.url.startsWith('/api/')) {
      req.url = req.url.slice(4);
      next();
    } else if (req.url === '/api') {
      req.url = '/';
      next();
    } else {
      next();
    }
  });

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger OpenAPI Documentation (Bonus)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Afrikedge Transport Planning API')
    .setDescription(
      'API REST de planification des transports - Recrutement SEFS1026',
    )
    .setVersion('1.0')
    .addTag('Sales Orders', 'Commandes de vente à planifier')
    .addTag('Vehicles', 'Véhicules actifs pour les tournées')
    .addTag('Transport Orders', 'Gestion du cycle de vie des ordres de transport')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-User-Id',
        in: 'header',
        description: 'Identifiant utilisateur : "diane" (DISPATCHER) ou "eric" (LOGISTICS_MANAGER)',
      },
      'X-User-Id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

bootstrap();

