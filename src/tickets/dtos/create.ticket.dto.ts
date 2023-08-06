export interface CreateTicketDto {
  _id: string;
  startCity: string;
  endCity: string;
  departureTime: Date;
  arrivalTime: Date;
  duration: string;
  sentNumber: number;
  passenger: {
    name: string;
  };
  price: Number;
  status: string;
  busId: string;
}
