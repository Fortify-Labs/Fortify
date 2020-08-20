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

	// --- User Status ---

	@Column({ default: false })
	registered!: boolean;

	@Column({ default: false })
	suspended!: boolean;

	@Column({ default: false })
	tosAccepted!: boolean;

	@Column({ default: false })
	publicProfile!: boolean;

	// --- Properties ---

	@Column({ default: "" })
	name!: string;

	@Column({ nullable: true })
	profilePicture?: string;

	@Column({
		nullable: true,
		type: "varchar",
	})
	twitchName?: string | null;
	@Column({
		nullable: true,
		type: "varchar",
	})
	twitchId?: string | null;
	@Column({ nullable: true, type: "json" })
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	twitchRaw?: any;

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
