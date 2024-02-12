import {Model, Table, Column} from 'sequelize-typescript';

@Table
export default class User extends Model {
    @Column username!: string;
    @Column password!: string;
    @Column token!: string;
    @Column refreshToken!: string;
}