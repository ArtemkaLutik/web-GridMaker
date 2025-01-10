const zipUpload = document.getElementById('zipUpload');
const gridWidth = document.getElementById('gridWidth');
const gridHeight = document.getElementById('gridHeight');
const generateGrid = document.getElementById('generateGrid');
const downloadGrid = document.getElementById('downloadGrid');
const progressBar = document.getElementById('progressBar');
const gridCanvas = document.getElementById('gridCanvas');
const ctx = gridCanvas.getContext('2d');

let images = [];

// Log helper function
function log(message) {
    console.log(message);
}

// Update progress bar
function updateProgressBar(progress) {
    progressBar.style.width = `${progress}%`;
}

// Handle ZIP file upload
zipUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.zip')) {
        log(`Processing ZIP file: ${file.name}`);
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(file);
        images = [];
        updateProgressBar(0);

        const fileNames = Object.keys(zipContents.files).filter(filename =>
            filename.match(/\.(jpg|jpeg|png|gif)$/i)
        );

        const totalFiles = fileNames.length;
        for (let i = 0; i < totalFiles; i++) {
            const filename = fileNames[i];
            const fileData = await zipContents.files[filename].async('blob');
            const url = URL.createObjectURL(fileData);
            const img = new Image();
            img.src = url;
            await img.decode();
            images.push(img);
            log(`Loaded image: ${filename}`);
            updateProgressBar(((i + 1) / totalFiles) * 100);
        }
        log(`Total images loaded: ${images.length}`);
    } else {
        alert('Please upload a valid .zip file containing images.');
    }
});

// Suggest optimal resolution
function suggestResolution(images, width, height) {
    const totalImages = images.length;
    const imageWidth = images[0].width;
    const imageHeight = images[0].height;
    const aspectRatio = width / height;

    const columns = Math.ceil(Math.sqrt(totalImages * aspectRatio));
    const rows = Math.ceil(totalImages / columns);

    const suggestedWidth = columns * imageWidth;
    const suggestedHeight = rows * imageHeight;

    return { suggestedWidth, suggestedHeight, columns, rows };
}

// Generate Grid
generateGrid.addEventListener('click', () => {
    if (!images.length) {
        alert('Please upload images first.');
        return;
    }

    const width = parseInt(gridWidth.value, 10);
    const height = parseInt(gridHeight.value, 10);
    if (!width || !height) {
        alert('Please enter valid grid dimensions.');
        return;
    }

    const { suggestedWidth, suggestedHeight, columns, rows } = suggestResolution(images, width, height);
    const thumbWidth = Math.floor(suggestedWidth / columns);
    const thumbHeight = Math.floor(suggestedHeight / rows);

    gridCanvas.width = suggestedWidth;
    gridCanvas.height = suggestedHeight;
    ctx.clearRect(0, 0, suggestedWidth, suggestedHeight);

    log(`Generating grid: ${suggestedWidth}x${suggestedHeight}`);
    updateProgressBar(0);

    images.forEach((img, index) => {
        const x = (index % columns) * thumbWidth;
        const y = Math.floor(index / columns) * thumbHeight;

        const cropWidth = Math.min(img.width, img.height * (thumbWidth / thumbHeight));
        const cropHeight = Math.min(img.height, img.width * (thumbHeight / thumbWidth));
        const cropX = (img.width - cropWidth) / 2;
        const cropY = (img.height - cropHeight) / 2;

        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, x, y, thumbWidth, thumbHeight);
        updateProgressBar(((index + 1) / images.length) * 100);
    });

    downloadGrid.disabled = false;
    log('Grid generation complete.');
});

// Handle grid download
downloadGrid.addEventListener('click', () => {
    if (!gridCanvas.width || !gridCanvas.height) {
        alert('No grid has been generated to download.');
        log('[ERROR] Attempted to download before generating a grid.');
        return;
    }

    const link = document.createElement('a');
    link.download = 'image_grid.jpg'; // Specify the file name
    link.href = gridCanvas.toDataURL('image/jpeg', 1.0); // Convert canvas to JPEG
    link.click(); // Trigger download
    log('Grid downloaded as image_grid.jpg.');
});
