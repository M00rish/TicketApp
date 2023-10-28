export interface Itrip {
  _id: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: Date;
  arrivalTime: Date;
  duration: string;
  price: number;
  ratings: number;
  bookedSeats: number[];
  busId: string;
}
