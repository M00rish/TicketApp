export interface CreateUserDto {
  id: string;
  email: string;
  password: string;
  FirstName?: string;
  lastName?: string;
  permissionLevel?: string;
}
