export interface PutUserDto {
  email: string;
  password: string;
  FirstName: string; // TODO: fix this
  lastName: string;
  image: string;
  permissionFlags: string;
  refreshToken: string;
}
