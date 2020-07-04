import { PrimaryColumn, Entity, Column } from "typeorm";

@Entity()
export class User {
	// We are going to be using the 32 bit steamid representation
	@PrimaryColumn()
	steamid!: string;

	@Column()
	name!: string;

	@Column({
		nullable: true,
	})
	twitch_name?: string;

	@Column({
		nullable: true,
	})
	twitch_id?: string;
}
