export interface CreateUserDto {
  email: string;
  password: string;
  FirstName?: string;
  lastName?: string;
  permissionFlags?: string;
}
