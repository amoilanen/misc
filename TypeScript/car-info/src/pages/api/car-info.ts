import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCarInfo } from '../../services/bisApi';

// TODO: Replace with actual API call to Finnish vehicle registry
const mockCarInfo = {
  licensePlate: 'ABC-123',
  make: 'Toyota',
  model: 'Corolla',
  year: 2018,
  color: 'Silver',
  basicInfo: {
    registrationDate: '2018-03-15',
    lastInspection: '2023-03-15',
    status: 'Active',
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { plate } = req.query;

  if (!plate || typeof plate !== 'string') {
    return res.status(400).json({ message: 'License plate is required' });
  }

  try {
    const carInfo = await fetchCarInfo(plate);
    return res.status(200).json(carInfo);
  } catch (error) {
    console.error('Error fetching car information:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 