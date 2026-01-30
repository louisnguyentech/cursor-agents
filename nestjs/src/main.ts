import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_TITLE', 'API'))
    .setDescription(configService.get('SWAGGER_DESCRIPTION', 'API documentation'))
    .setVersion(configService.get('SWAGGER_VERSION', '1.0'))
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(configService.get('SWAGGER_PATH', 'docs'), app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/${configService.get('SWAGGER_PATH', 'docs')}`);
}
bootstrap();
