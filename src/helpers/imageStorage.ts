const FileType = import('file-type')
import fs from 'fs'
import logging from 'library/Logging'
import { diskStorage, Options } from 'multer'
import { extname } from 'path'

type validFileExtensionsType = 'png' | 'jpg' | 'jpeg'
type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg'

const validFileExtensions: validFileExtensionsType[] = ['png', 'jpg', 'jpeg']
const validMimeTypes: validMimeType[] = ['image/png', 'image/jpg', 'image/jpeg']

export const saveImageToStorage: Options = {
  storage: diskStorage({
    destination: './files',
    filename(req, file, callback) {
      // Create unique suffix
      const uniqueSuffix = Date.now() + +Math.round(Math.random() * 1e9)
      // Get file extension
      const ext = extname(file.originalname)
      // write filename
      const filename = `${uniqueSuffix}${ext}`

      callback(null, filename)
    },
  }),
  fileFilter(req, file, callback) {
    const allowedMimeTypes: validMimeType[] = validMimeTypes
    allowedMimeTypes.includes(file.mimetype as validMimeType) ? callback(null, true) : callback(null, false)
  },
}

export const isFIleExtensionSafe = async (fullFIlePath: string): Promise<boolean> => {
  return (await FileType).fileTypeFromFile(fullFIlePath).then((fileExtensionAndMimeType) => {
    if (!fileExtensionAndMimeType?.ext) return false

    const isFileTyleLegit = validFileExtensions.includes(fileExtensionAndMimeType.ext as validFileExtensionsType)
    const isMimeTypeLegit = validMimeTypes.includes(fileExtensionAndMimeType.mime as validMimeType)
    const isFileLegit = isFileTyleLegit && isMimeTypeLegit
    return isFileLegit
  })
}

export const removeFile = (fullFilePath: string): void => {
  try {
    fs.unlinkSync(fullFilePath)
  } catch (error) {
    logging.error(error)
  }
}
