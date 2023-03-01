export interface CRUD {
  list: (limit: number, page: number) => Promise<any>;
  create: (ressource: any) => Promise<any>;
  putById: (id: string, ressource: any) => Promise<any>;
  readById: (id: string) => Promise<any>;
  deleteById: (id: string) => Promise<any>;
  patchById: (id: string, ressource: any) => Promise<any>;
}
