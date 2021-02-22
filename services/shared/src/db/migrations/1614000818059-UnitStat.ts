import { MigrationInterface, QueryRunner } from "typeorm";

export class UnitStats1614000818059 implements MigrationInterface {
	name = "UnitStats1614000818059";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'CREATE TABLE "unit_stats" ("id" integer NOT NULL, "win" integer NOT NULL, "averageMMR" integer NOT NULL, "round" integer NOT NULL, "gameMode" integer NOT NULL, "rank" integer NOT NULL, "time" TIMESTAMP NOT NULL DEFAULT now(), "activeAlliances" jsonb NOT NULL, "underlordTalent" jsonb, "items" jsonb)',
		);
		await queryRunner.query(
			'CREATE TABLE "item_stats" ("id" integer NOT NULL, "win" integer NOT NULL, "averageMMR" integer NOT NULL, "round" integer NOT NULL, "gameMode" integer NOT NULL, "time" TIMESTAMP NOT NULL DEFAULT now(), "activeAlliances" jsonb NOT NULL)',
		);
		await queryRunner.query(
			'CREATE TABLE "synergy_stats" ("id" integer NOT NULL, "win" integer NOT NULL, "averageMMR" integer NOT NULL, "round" integer NOT NULL, "gameMode" integer NOT NULL, "time" TIMESTAMP NOT NULL DEFAULT now(), "rank" integer, "activeAlliances" jsonb NOT NULL)',
		);

		for (const table of ["unit_stats", "item_stats", "synergy_stats"]) {
			await queryRunner.query(`
				SELECT create_hypertable('${table}', 'time');
			`);

			await queryRunner.query(`
				CREATE INDEX ${table}_activeAlliances_idx ON ${table} USING GIN ("activeAlliances");
			`);

			await queryRunner.query(`
				ALTER TABLE ${table} SET (
					timescaledb.compress,
					timescaledb.compress_segmentby = 'id, "gameMode", round'
				);
			`);

			await queryRunner.query(`
				SELECT add_compression_policy('${table}', INTERVAL '7 days');
			`);
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP TABLE "synergy_stats"');
		await queryRunner.query('DROP TABLE "item_stats"');
		await queryRunner.query('DROP TABLE "unit_stats"');
	}
}
