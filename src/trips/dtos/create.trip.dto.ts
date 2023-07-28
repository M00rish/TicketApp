export interface CreateTripDto {
  startCity: string;
  finishCity: string;
  startDate: Date;
  finishDate: Date;
  price: number;
  seats: number;
  busId: string;
}
