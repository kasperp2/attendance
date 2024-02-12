import {Model, Table, Column, PrimaryKey, DataType, Default, ForeignKey, BelongsTo} from 'sequelize-typescript';
import Attendance from './Attendance';
import User from './User';

@Table
export default class Name extends Model {
    @PrimaryKey
    @Default(() => [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''))
    @Column({type: DataType.STRING(16)})
    public id: any

    @Column name!: string

    @ForeignKey(() => User) @Column user_id!: number
    @BelongsTo(() => User) user: User = new User()

    @Column group!: string
    @Column card_assigned!: boolean
}