import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import logging from 'library/Logging'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import express from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser())
  // Setup to display files
  app.use('/files', express.static('files'))

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('NestJS tutorial API')
    .setDescription('This is API for NestJS tutorial.')
    .setVersion('1.0.0')
    .build()

  const PORT = process.env.PORT || 8080
  await app.listen(PORT)

  logging.info(`App is listening on: ${await app.getUrl()}`)
}
bootstrap()
