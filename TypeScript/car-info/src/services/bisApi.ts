import { CarInfo } from '../types/car';

const BIS_API_URL = process.env.BIS_API_URL || 'https://api-test.bisnode.fi/vehicle/info/v1';
const BIS_API_KEY = process.env.BIS_API_KEY;
const BIS_USER_ID = process.env.BIS_USER_ID;

interface BISResponse {
  data: {
    vehicle: {
      registrationNumber: string;
      make: string;
      model: string;
      year: number;
      color: string;
      registrationDate: string;
      lastInspection: string;
      status: string;
      ownerHistory: Array<{
        ownerName: string;
        registrationDate: string;
        deregistrationDate?: string;
      }>;
      serviceHistory: Array<{
        date: string;
        description: string;
        mileage: number;
      }>;
    };
  };
}

export async function fetchCarInfo(licensePlate: string): Promise<CarInfo> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return fetchMockData(licensePlate);
  }

  if (!BIS_API_KEY || !BIS_USER_ID) {
    throw new Error('BIS API credentials are not configured');
  }

  try {
    const response = await fetch(`${BIS_API_URL}/vehicles/${licensePlate}`, {
      headers: {
        'Authorization': `Bearer ${BIS_API_KEY}`,
        'X-User-ID': BIS_USER_ID,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`BIS API error: ${response.statusText}`);
    }

    const data: BISResponse = await response.json();
    return transformBISResponse(data);
  } catch (error) {
    console.error('Error fetching car information:', error);
    throw error;
  }
}

function transformBISResponse(response: BISResponse): CarInfo {
  const { vehicle } = response.data;
  return {
    licensePlate: vehicle.registrationNumber,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    basicInfo: {
      registrationDate: vehicle.registrationDate,
      lastInspection: vehicle.lastInspection,
      status: vehicle.status,
    },
    detailedInfo: {
      ownerHistory: vehicle.ownerHistory.map(owner => ({
        name: owner.ownerName,
        registrationDate: owner.registrationDate,
        deregistrationDate: owner.deregistrationDate,
      })),
      serviceHistory: vehicle.serviceHistory.map(service => ({
        date: service.date,
        description: service.description,
        mileage: service.mileage,
      })),
    },
  };
}

function fetchMockData(licensePlate: string): CarInfo {
  return {
    licensePlate,
    make: 'Toyota',
    model: 'Corolla',
    year: 2018,
    color: 'Silver',
    basicInfo: {
      registrationDate: '2018-03-15',
      lastInspection: '2023-03-15',
      status: 'Active',
    },
    detailedInfo: {
      ownerHistory: [
        {
          name: 'John Doe',
          registrationDate: '2018-03-15',
          deregistrationDate: '2020-06-20',
        },
        {
          name: 'Jane Smith',
          registrationDate: '2020-06-21',
        },
      ],
      serviceHistory: [
        {
          date: '2019-03-15',
          description: 'Regular maintenance',
          mileage: 25000,
        },
        {
          date: '2021-03-15',
          description: 'Oil change and inspection',
          mileage: 50000,
        },
      ],
    },
  };
} 