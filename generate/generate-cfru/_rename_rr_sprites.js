const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const sourceFolder = 'rr'
const destinationFolder = __dirname

function extractSuffixFromFilename(filename) {
  const match = filename.match(/gFrontSprite\d+(.*)\.png$/i) // Match the part after gFrontSprite### until .png
  return match ? match[1] : null
}

function formatSuffix(suffix) {
  if (suffix.length === 0) return suffix
  return suffix[0].toUpperCase() + suffix.slice(1).toLowerCase() // Capitalize first letter, lowercase the rest
}

function removeBackgroundBasedOnTopLeftPixel(sourcePath, destinationPath) {
  sharp(sourcePath)
    .ensureAlpha()
    .toBuffer()
    .then((data) => {
      return sharp(data).raw().toBuffer({ resolveWithObject: true })
    })
    .then(({ data, info }) => {
      const [r, g, b] = [data[0], data[1], data[2]]

      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
          data[i + 3] = 0
        }
      }

      return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toFile(destinationPath)
    })
    .then(() => {
      console.log(`Processed and saved: ${destinationPath}`)
    })
    .catch((error) => {
      console.error(`Error processing ${sourcePath}:`, error)
    })
}

function deleteExistingImages() {
  const files = fs.readdirSync(destinationFolder)
  files.forEach((file) => {
    const filePath = path.join(destinationFolder, file)
    if (file.match(/\.(png|jpg|jpeg|gif)$/i) && fs.lstatSync(filePath).isFile()) {
      fs.unlinkSync(filePath) // Delete the file
      console.log(`Deleted existing image: ${filePath}`)
    }
  })
}

function processImages() {
  deleteExistingImages()

  const files = fs.readdirSync(sourceFolder)
  files.forEach((file) => {
    const suffix = extractSuffixFromFilename(file)
    if (suffix) {
      const formattedSuffix = formatSuffix(suffix) // Format the suffix
      const sourcePath = path.join(sourceFolder, file)
      const destinationPath = path.join(destinationFolder, `${formattedSuffix}.png`)
      removeBackgroundBasedOnTopLeftPixel(sourcePath, destinationPath)
    } else {
      console.log(`Skipped file (no suffix found): ${file}`)
    }
  })
}

processImages()
