import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Signed URL generation has been disabled — images are public in R2.
  res.status(404).json({ error: 'Signed URL endpoint disabled' });
}
