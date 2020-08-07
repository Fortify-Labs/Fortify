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
	// Technically this is a lobby fingerprint
	@PrimaryColumn()
	id!: string;

	@Index()
	@Column({ generated: "increment" })
	autoID!: number;

	@CreateDateColumn()
	matchStartTime!: Date;

	@UpdateDateColumn()
	lastMatchUpdateTime!: Date;

	@Column({
		nullable: true,
	})
	matchEndTime?: Date;

	@Column({ default: 0 })
	averageMMR!: number;

	@Column({ default: 0 })
	gameMode!: FortifyGameMode;

	@OneToMany(() => MatchSlot, (mp) => mp.match, {
		cascade: true,
	})
	slots!: MatchSlot[];
}
