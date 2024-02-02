import {Model, Table, Column, HasMany, PrimaryKey, DataType, Default} from 'sequelize-typescript';
import Attendance from './Attendance';

@Table
export default class Name extends Model {
    @PrimaryKey
    @Default(() => [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''))
    @Column({type: DataType.STRING(16)})
    public id: any

    @Column name!: string
    @Column user_id!: string
    @Column group!: string
    @Column card_assigned!: boolean
    
    // @HasMany(() => Attendance) attendance: Attendance[] | undefined
    
}