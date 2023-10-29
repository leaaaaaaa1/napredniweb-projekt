// pages/api/addUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, email, sub } = req.body;  
    const existingUser = await prisma.user.findUnique({
      where: { auth0Id: sub },
    });

    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          auth0Id: sub,
          email: email,
          name: name,
        },
      });
      return res.status(200).json(newUser);
    } else {
      return res.status(409).json({ error: 'User already exists' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
