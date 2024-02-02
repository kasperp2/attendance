import {Model, Table, Column, PrimaryKey, DataType, Default} from 'sequelize-typescript';


@Table
export default class User extends Model {
    @Column name!: string;
    @Column password!: string;
}