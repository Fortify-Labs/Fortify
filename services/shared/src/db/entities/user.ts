import {
	PrimaryColumn,
	Entity,
	Column,
	OneToMany,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
} from "typeorm";
import { MatchSlot } from "./matchSlot";
import { MmrStats } from "./mmr";

export class MMR {
	@Column({ default: 0 })
	mmr?: number;

	@Column({ default: 0 })
	rank?: number;

	@Column({
		nullable: true,
	})
	rankTier?: number;
}

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

	@Column(() => MMR)
	standardRating?: MMR;

	@Column(() => MMR)
	turboRating?: MMR;

	@Column(() => MMR)
	duosRating?: MMR;

	// --- Relations ---
	@OneToMany(() => MatchSlot, (slot) => slot.user)
	matchSlots!: MatchSlot[];

	@OneToMany(() => MmrStats, (stat) => stat.user)
	mmrStats!: MmrStats;

	// --- Smurfs ---

	@ManyToOne(() => User, { nullable: true })
	mainAccount?: User;

	// --- Dates ---

	@CreateDateColumn()
	created!: Date;

	@UpdateDateColumn()
	updated!: Date;
}
