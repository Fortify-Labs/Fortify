import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id!: string;

	@Column()
	name!: string;

	@Column()
	email!: string;
}
