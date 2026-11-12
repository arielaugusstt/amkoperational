export function compressImageFile(file, maxWidth = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            return reject(new Error('File yang dipilih bukan gambar'));
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const image = new Image();
            image.onload = () => {
                let width = image.width;
                let height = image.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve({
                    base64: dataUrl,
                    width,
                    height,
                    originalSize: file.size,
                    compressedSize: Math.round(dataUrl.length * 0.75),
                });
            };
            image.onerror = (err) => reject(err);
            image.src = readerEvent.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

