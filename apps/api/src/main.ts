import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  const allowedOrigins = [
    ...(process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
    process.env.SCHOOL_PORTAL_ORIGIN ?? "",
  ]
    .map((origin) => origin.trim())
    .filter((origin, index, origins) => origin.length > 0 && origins.indexOf(origin) === index);
  app.enableCors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
