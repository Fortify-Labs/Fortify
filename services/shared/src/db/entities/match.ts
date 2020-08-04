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

@Entity()
export class Match {
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

	// @Column()
	// averageMMR!: number;

	@OneToMany(() => MatchSlot, (mp) => mp.match, {
		cascade: true,
	})
	slots!: MatchSlot[];
}
