import {
	Entity,
	PrimaryColumn,
	ManyToOne,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
} from "typeorm";
import { Match } from "./match";
import { User } from "./user";

@Entity()
export class MatchSlot {
	// --- IDs ---
	// We are going to create a composite primary key by using the unique player slot + the match reference

	// The lobby slot of said player
	@PrimaryColumn()
	slot!: number;

	@ManyToOne(() => Match, (match) => match.slots, { primary: true })
	match!: Match;

	// --- Dates ---

	@CreateDateColumn()
	created!: Date;

	@UpdateDateColumn()
	updated!: Date;

	// --- Relations ---

	// Will be used if said player has a fortify account
	@ManyToOne(() => User, (user) => user.matchSlots, {
		nullable: true,
		cascade: true,
	})
	user?: User;

	// --- Fields ---

	// The final place of said player in the lobby
	@Column()
	finalPlace!: number;
}
