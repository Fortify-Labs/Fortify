import {
	PrimaryColumn,
	Entity,
	Column,
	OneToMany,
	CreateDateColumn,
	Index,
	UpdateDateColumn,
} from "typeorm";
import { MatchSlot } from "./matchSlot";
import { FortifyGameMode } from "../../state";

@Entity()
export class Match {
	// --- IDs ---

	// Technically this is a lobby fingerprint
	@PrimaryColumn()
	id!: string;

	@Index()
	@Column({ generated: "increment" })
	autoID!: number;

	// --- Dates ---

	@Index()
	@CreateDateColumn()
	created!: Date;

	@UpdateDateColumn()
	updated!: Date;

	@Column({
		nullable: true,
	})
	ended?: Date;

	// --- Properties ---

	@Column({ default: 0 })
	averageMMR!: number;

	@Column({ default: 0 })
	gameMode!: FortifyGameMode;

	// --- Relations ---

	@OneToMany(() => MatchSlot, (mp) => mp.match, {
		cascade: true,
	})
	slots!: MatchSlot[];
}
