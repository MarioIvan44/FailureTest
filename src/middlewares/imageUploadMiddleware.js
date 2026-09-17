import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/avi",
    // Fonts
    "font/ttf",
    "font/otf",
    "font/woff",
    "font/woff2",
    "font/sfnt",
    "application/x-font-ttf",
    "application/x-font-truetype",
    "application/x-font-opentype",
    "application/x-font-otf",
    "application/font-woff",
    "application/font-woff2",
    "application/vnd.ms-fontobject",
    "application/font-sfnt",
    "application/octet-stream" // Sometimes browsers send valid files as binary
  ];

  const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

  // Check mime type check
  const isMimeTypeValid = allowedTypes.includes(file.mimetype);

  if (isMimeTypeValid) {
    // If it's octet-stream, verify extension is one of our font or video/image types
    if (file.mimetype === 'application/octet-stream') {
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        console.log(`Blocked octet-stream file with extension: ${fileExtension}`);
        cb(new Error(`Archivo no permitido. Extensión: ${fileExtension}`), false);
      }
    } else {
      cb(null, true);
    }
  } else {
    console.log(`Blocked file upload. Mimetype: ${file.mimetype}, Extension: ${fileExtension}`);
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for videos
  },
});

