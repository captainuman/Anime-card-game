const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/cards");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 12)}`;

    cb(null, `${uniqueName}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/jpg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
  };

  const mimetype = String(file.mimetype || "").toLowerCase();
  const extension = path.extname(file.originalname || "").toLowerCase();

  const allowedExtensions = allowedTypes[mimetype];

  if (allowedExtensions?.includes(extension)) {
    cb(null, true);
    return;
  }

  cb(
    new Error("Only JPG, JPEG, PNG, WEBP and GIF images are allowed"),
    false,
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;