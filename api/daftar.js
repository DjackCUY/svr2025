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
      { name: 'file-format' },
      { name: 'file-formulir' },
    ]));

    const fileSWP = req.files['file-swp']?.[0];
    const fileFormat = req.files['file-format']?.[0];
    const fileForm = req.files['file-formulir']?.[0];

    const swpUrl = fileSWP
      ? (await uploadToCloudinary(fileSWP.buffer, fileSWP.originalname || 'swp'))
      : null;
    const formatUrl = fileFormat
      ? (await uploadToCloudinary(fileFormat.buffer, fileFormat.originalname || 'format')).replace(/\.pdf$/, '.jpg')
      : null;
    const formulirUrl = fileForm
      ? (await uploadToCloudinary(fileForm.buffer, fileForm.originalname || 'formulir')).replace(/\.pdf$/, '.jpg')
      : null;

    const { name, email, instansi, nomor } = req.body;

    if (!name || !email || !instansi || !nomor) {
      return res.status(400).json({ error: "Form tidak lengkap." });
    }

    const client = await clientPromise;
    const db = client.db('svr-2025'); // default DB dari URI
    const collection = db.collection('form_daftar');

    const date = new Date();
    const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
    timeZoneName: 'short'
    };

    const indonesiaTime = date.toLocaleString('id-ID', options);

    const insertResult = await collection.insertOne({
      name,
      email,
      instansi,
      nomor,
      swpUrl,
      formatUrl,
      formulirUrl,
      timestamp: indonesiaTime,
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
