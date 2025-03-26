import { InternalServerErrorException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import logging from 'library/Logging'

export const hash = async (data: string, salt = 10): Promise<string> => {
  try {
    const generatedSalt = await bcrypt.genSalt(salt)
    return bcrypt.hash(data, generatedSalt)
  } catch (error) {
    logging.error(error)
    throw new InternalServerErrorException('Something went wrong while hashinh password.')
  }
}

export const compareHash = async (data: string | Buffer, encryptedData: string): Promise<boolean> => {
  try {
    return bcrypt.compare(data, encryptedData)
  } catch (error) {
    logging.error(error)
    throw new InternalServerErrorException('Something went wrong while comparing hash.')
  }
}
