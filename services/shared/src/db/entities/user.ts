import {
	PrimaryColumn,
	Entity,
	Column,
	OneToMany,
	CreateDateColumn,
	UpdateDateColumn,
} from "typeorm";
import { MatchSlot } from "./matchSlot";

@Entity()
export class User {
	// --- ID ---

	// We are going to be using the 32 bit steamid representation
	@PrimaryColumn()
	steamid!: string;

	// --- Properties ---

	@Column()
	name!: string;

	@Column({ nullable: true })
	profilePicture?: string;

	@Column({
		nullable: true,
	})
	twitchName?: string;
	@Column({
		nullable: true,
	})
	twitchId?: string;

	@Column({
		nullable: true,
	})
	discordName?: string;

	@Column({
		nullable: true,
	})
	rankTier?: number;

	// --- Relations ---

	@OneToMany(() => MatchSlot, (slot) => slot.user)
	matchSlots!: MatchSlot[];

	// --- Dates ---

	@CreateDateColumn()
	created!: Date;

	@UpdateDateColumn()
	updated!: Date;
}
