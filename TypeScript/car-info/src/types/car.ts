export interface CarInfo {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  basicInfo: {
    registrationDate: string;
    lastInspection: string;
    status: string;
  };
  detailedInfo: {
    ownerHistory: Array<{
      name: string;
      registrationDate: string;
      deregistrationDate?: string;
    }>;
    serviceHistory: Array<{
      date: string;
      description: string;
      mileage: number;
    }>;
  };
} 