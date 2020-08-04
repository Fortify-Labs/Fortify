import { PrimaryColumn, Entity, Column, OneToMany } from "typeorm";
import { MatchSlot } from "./matchSlot";

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

	@OneToMany(() => MatchSlot, (slot) => slot.user)
	matchSlots!: MatchSlot[];
}
