import {Model, Table, Column, ForeignKey, BelongsTo} from 'sequelize-typescript';
import Name from './Name';

@Table
export default class Attendance extends Model {
    @ForeignKey(() => Name) @Column name_id!: string;
    // @BelongsTo(() => Name) name: Name | undefined;
}