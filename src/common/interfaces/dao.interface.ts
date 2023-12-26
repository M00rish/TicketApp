export interface IDao {
  list(ressource: any): Promise<Array<any>>;
  create(ressource: any): Promise<String>;
  deleteById(id: String): Promise<void>;
  updateById(id: String, ressource: any): Promise<String>;
  getById(id: String): Promise<any>;
}
