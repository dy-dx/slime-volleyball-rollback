import { IEntity } from '../entities/entity.js';

export default interface ISystem {
  update(entities: IEntity[], dt: number): void;
}
