import { calculateHaversineDistanceMeters } from "../hardware-locator/places.functions";

export interface SosEmergencyDispatch {
  id: string;
  customerId?: string;
  trade: "Plumbing" | "Electrical" | "AC Emergency";
  emergencyType: string;
  locationAddress: string;
  lat: number;
  lng: number;
  fixedBasePaise: number;
  status: "BROADCASTING" | "ACCEPTED_EN_ROUTE" | "ARRIVED_ON_SITE" | "RESOLVED" | "CANCELLED";
  assignedPro?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    currentDistanceMeters: number;
  };
  etaMinutes?: number;
  createdAt: string;
  acceptedAt?: string;
}

/**
 * Feature 6 Core: Create an SOS Rapid Emergency Dispatch Ticket
 */
export function createSosEmergencyDispatchCore(params: {
  trade: "Plumbing" | "Electrical" | "AC Emergency";
  emergencyType: string;
  locationAddress: string;
  lat: number;
  lng: number;
  customerId?: string;
}): SosEmergencyDispatch {
  return {
    id: `sos-${Date.now()}`,
    customerId: params.customerId,
    trade: params.trade,
    emergencyType: params.emergencyType,
    locationAddress: params.locationAddress,
    lat: params.lat,
    lng: params.lng,
    fixedBasePaise: 79900, // ₹799 upfront transparent base
    status: "BROADCASTING",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Feature 6: On-duty nearby artisan accepts dispatch
 */
export function acceptEmergencyDispatchCore(params: {
  sos: SosEmergencyDispatch;
  proId: string;
  proName: string;
  proPhone: string;
  proLat: number;
  proLng: number;
}): SosEmergencyDispatch {
  if (params.sos.status !== "BROADCASTING") {
    throw new Error("Emergency request has already been accepted or resolved.");
  }

  const distanceMeters = calculateHaversineDistanceMeters(
    params.sos.lat,
    params.sos.lng,
    params.proLat,
    params.proLng
  );

  // Approximate Mumbai travel time: ~5 mins per km + 5 mins prep
  const etaMinutes = Math.max(12, Math.min(30, Math.round((distanceMeters / 1000) * 5 + 5)));

  return {
    ...params.sos,
    status: "ACCEPTED_EN_ROUTE",
    acceptedAt: new Date().toISOString(),
    etaMinutes,
    assignedPro: {
      id: params.proId,
      name: params.proName,
      phone: params.proPhone,
      rating: 4.9,
      currentDistanceMeters: distanceMeters,
    },
  };
}
