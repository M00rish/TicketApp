export interface CRUD {
  list: (limit: number, page: number) => Promise<any>;
  create: (ressource: any) => Promise<any>;
  getById: (id: string) => Promise<any>;
  deleteById: (id: string) => Promise<any>;
  updateById: (id: string, ressource: any) => Promise<any>;
}
