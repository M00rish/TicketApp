export interface CreateTripDto {
  departureCity: string;
  arrivalCity: string;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
  seats: number;
  busId: string;
}
