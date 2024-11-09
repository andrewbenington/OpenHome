const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceFolder = 'rr'; 
const destinationFolder = __dirname;

function extractIdFromFilename(filename) {
    const match = filename.match(/gFrontSprite(\d+)/);
    return match ? match[1].replace(/^0+/, '') : null;
}

function removeBackgroundBasedOnTopLeftPixel(sourcePath, destinationPath) {
    sharp(sourcePath)
        .ensureAlpha()
        .toBuffer()
        .then((data) => {
            return sharp(data).raw().toBuffer({ resolveWithObject: true });
        })
        .then(({ data, info }) => {
            const [r, g, b] = [data[0], data[1], data[2]]; 

            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
                    data[i + 3] = 0; 
                }
            }

            return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
                .png()
                .toFile(destinationPath);
        })
        .then(() => {
            console.log(`Processed and saved: ${destinationPath}`);
        })
        .catch(error => {
            console.error(`Error processing ${sourcePath}:`, error);
        });
}

function deleteExistingImages() {
    const files = fs.readdirSync(destinationFolder);
    files.forEach(file => {
        const filePath = path.join(destinationFolder, file);
        if (file.match(/\.(png|jpg|jpeg|gif)$/i) && fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath); // Delete the file
            console.log(`Deleted existing image: ${filePath}`);
        }
    });
}

function processImages() {
    deleteExistingImages();

    const files = fs.readdirSync(sourceFolder);
    files.forEach(file => {
        const id = extractIdFromFilename(file);
        if (id) {
            const sourcePath = path.join(sourceFolder, file);
            const destinationPath = path.join(destinationFolder, `${id}.png`);
            removeBackgroundBasedOnTopLeftPixel(sourcePath, destinationPath);
        } else {
            console.log(`Skipped file (no ID found): ${file}`);
        }
    });
}

processImages();
