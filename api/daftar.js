import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';
import clientPromise from "../lib/mongodb";

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Konfigurasi agar bodyParser dinonaktifkan (karena pakai multer)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Gunakan penyimpanan memory untuk multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Middleware agar multer bisa dipakai di Next.js API route
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}

// Fungsi upload ke Cloudinary dari buffer
const uploadToCloudinary = (fileBuffer, filename) => {
  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'uploads',
        public_id: filename.replace(/\.[^/.]+$/, ""), // hilangkan ekstensi
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    bufferStream.pipe(uploadStream);
  });
};

// Handler utama API
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Jalankan middleware multer
    await runMiddleware(req, res, upload.fields([
      { name: 'file-swp' },
      { name: 'file-follow' },
    ]));

    const fileSWP = req.files['file-swp']?.[0];
    const fileFollow = req.files['file-follow']?.[0];

    const swpUrl = fileSWP
      ? await uploadToCloudinary(fileSWP.buffer, fileSWP.originalname || 'swp')
      : null;
    const followUrl = fileFollow
      ? await uploadToCloudinary(fileFollow.buffer, fileFollow.originalname || 'follow')
      : null;

    const { name, email, instansi, nomor } = req.body;

    if (!name || !email || !instansi || !nomor) {
      return res.status(400).json({ error: "Form tidak lengkap." });
    }

    const client = await clientPromise;
    const db = client.db(); // default DB dari URI
    const collection = db.collection('form_daftar');

    const insertResult = await collection.insertOne({
      name,
      email,
      instansi,
      nomor,
      swpUrl,
      followUrl,
      timestamp: new Date(),
    });

    console.log('MongoDB insert result:', insertResult);

    return res.status(200).send("OK");

  } catch (error) {
    // console.error('Handler error:', error);
    return res.status(500).json({
      error: error.message || "Terjadi kesalahan saat upload atau simpan data.",
    });
  }
}
