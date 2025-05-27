import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  try {
    await runMiddleware(req, res, upload.fields([
      { name: 'file-swp' },
      { name: 'file-follow' }
    ]));
  } catch (err) {
    return res.status(400).json({ error: "Ukuran file maksimal 5MB atau format tidak valid." });
  }

  const uploadToCloudinary = (fileBuffer, filename) => {
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'uploads', public_id: filename },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      bufferStream.pipe(stream);
    });
  };

  try {
    const fileSWP = req.files['file-swp']?.[0];
    const fileFollow = req.files['file-follow']?.[0];

    const swpUrl = fileSWP ? await uploadToCloudinary(fileSWP.buffer, fileSWP.originalname) : null;
    const followUrl = fileFollow ? await uploadToCloudinary(fileFollow.buffer, fileFollow.originalname) : null;

    return res.status(200).json({
      message: "Upload berhasil",
      swpUrl,
      followUrl
    });

  } catch (error) {
    return res.status(500).json({ error: "Upload ke Cloudinary gagal." });
  }
}
