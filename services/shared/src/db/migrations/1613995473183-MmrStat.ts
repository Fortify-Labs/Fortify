import { MigrationInterface, QueryRunner } from "typeorm";

export class MmrStats1613995473183 implements MigrationInterface {
	name = "MmrStats1613995473183";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE mmr_stats (
				time           timestamp  NOT NULL DEFAULT NOW(),
				mmr            int4       NOT NULL,
				rank           int4       NOT NULL,
				type           int4       NOT NULL,
				"userSteamid"  varchar    NOT NULL,
				CONSTRAINT fk_user
					FOREIGN KEY("userSteamid")
						REFERENCES "user"(steamid)
			);
		`);

		await queryRunner.query(`
			SELECT create_hypertable('mmr_stats', 'time');
		`);

		await queryRunner.query(`
			ALTER TABLE mmr_stats SET (
				timescaledb.compress,
				timescaledb.compress_segmentby = '"userSteamid", type'
			);
		`);

		await queryRunner.query(`
			SELECT add_compression_policy('mmr_stats', INTERVAL '7 days');
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "mmr_stats" DROP CONSTRAINT fk_user;
		`);

		await queryRunner.query(`
			DROP TABLE "mmr_stats"
		`);
	}
}
