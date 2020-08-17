import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchPlayerRemoval1597525293511 implements MigrationInterface {
	name = "MatchPlayerRemoval1597525293511";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" ADD "registered" boolean NOT NULL DEFAULT false',
		);
		await queryRunner.query('UPDATE "user" SET "registered" = TRUE');

		await queryRunner.query(
			'ALTER TABLE "match_slot" DROP CONSTRAINT "FK_c7ab41979bb4f8442caf3282413"',
		);

		await queryRunner.query(
			'ALTER TABLE "user" ALTER COLUMN "name" SET DEFAULT \'\'',
		);
		await queryRunner.query(
			'INSERT INTO "user" ("steamid", "rankTier", "name") (SELECT "steamid", "rankTier", "name" FROM "match_player")',
		);
		await queryRunner.query(
			'UPDATE "match_slot" SET "userSteamid" = "matchPlayerSteamid"',
		);
		await queryRunner.query(
			'ALTER TABLE "match_slot" DROP COLUMN "matchPlayerSteamid"',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "registered"');
		await queryRunner.query(
			'ALTER TABLE "user" ALTER COLUMN "name" DROP DEFAULT',
		);
		await queryRunner.query(
			'ALTER TABLE "match_slot" ADD "matchPlayerSteamid" character varying',
		);
		await queryRunner.query(
			'UPDATE "match_slot" SET "matchPlayerSteamid" = "userSteamid" WHERE "userSteamid" IN (SELECT "steamid" FROM "match_player")',
		);
		await queryRunner.query(
			'UPDATE "match_slot" SET "userSteamid" = NULL WHERE "userSteamid" IN (SELECT "steamid" FROM "match_player")',
		);
		await queryRunner.query(
			'ALTER TABLE "match_slot" ADD CONSTRAINT "FK_c7ab41979bb4f8442caf3282413" FOREIGN KEY ("matchPlayerSteamid") REFERENCES "match_player"("steamid") ON DELETE NO ACTION ON UPDATE NO ACTION',
		);
		await queryRunner.query(
			'DELETE FROM "user" WHERE "steamid" IN (SELECT "steamid" FROM "match_player")',
		);
	}
}
