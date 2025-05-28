import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';
import clientPromise from "@/lib/mongodb";

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
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await runMiddleware(req, res, upload.fields([
      { name: 'file-swp' },
      { name: 'file-follow' }
    ]));

    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    const fileSWP = req.files['file-swp']?.[0];
    const fileFollow = req.files['file-follow']?.[0];

    const swpUrl = fileSWP ? await uploadToCloudinary(fileSWP.buffer, fileSWP.originalname || 'swp') : null;
    const followUrl = fileFollow ? await uploadToCloudinary(fileFollow.buffer, fileFollow.originalname || 'follow') : null;

    const { name, email, instansi, nomor } = req.body;
    if (!name || !email || !instansi || !nomor) {
      return res.status(400).json({ error: "Form tidak lengkap." });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('form_daftar');

    await collection.insertOne({
      name,
      email,
      instansi,
      nomor,
      swpUrl,
      followUrl,
      timestamp: new Date()
    });

    return res.status(200).json({
      message: "Upload & penyimpanan berhasil",
      swpUrl,
      followUrl
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: "Terjadi kesalahan saat upload atau simpan data." });
  }
}
