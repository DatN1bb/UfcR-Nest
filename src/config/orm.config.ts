import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js'

type ConfigType = TypeOrmModuleOptions & PostgresConnectionOptions
type ConnectionOptions = ConfigType

export const ORMConfig = async (configService: ConfigService): Promise<ConnectionOptions> => {
  const host = configService.get('DATABASE_HOST')
  const port = configService.get('DATABASE_PORT')
  const username = configService.get('DATABASE_USERNAME')
  const password = configService.get('DATABASE_PWD')
  const database = configService.get('DATABASE_NAME')

  console.log('Database connection details:', { host, port, username, database })

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: ['dist/**/*.entity.ts'],
    synchronize: true, //only in development
    ssl: false,
  }
}
