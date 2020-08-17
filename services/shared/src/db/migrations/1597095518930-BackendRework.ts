import { MigrationInterface, QueryRunner } from "typeorm";

export class BackendRework1597095518930 implements MigrationInterface {
	name = "BackendRework1597095518930";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" RENAME COLUMN "twitch_name" TO "twitchName"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" RENAME COLUMN "twitch_id" TO "twitchId"',
		);
		await queryRunner.query(
			'ALTER TABLE "match" RENAME COLUMN "matchStartTime" TO "created"',
		);
		await queryRunner.query(
			'ALTER TABLE "match" RENAME COLUMN "lastMatchUpdateTime" TO "updated"',
		);
		await queryRunner.query(
			'ALTER TABLE "match" RENAME COLUMN "matchEndTime" TO "ended"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "profilePicture" character varying',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "discordName" character varying',
		);
		await queryRunner.query('ALTER TABLE "user" ADD "rankTier" integer');
		await queryRunner.query(
			'ALTER TABLE "match_player" ADD "rankTier" integer',
		);
		await queryRunner.query(
			'ALTER TABLE "match_slot" ADD "created" TIMESTAMP NOT NULL DEFAULT now()',
		);
		await queryRunner.query(
			'ALTER TABLE "match_slot" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()',
		);
		await queryRunner.query(
			'CREATE INDEX "IDX_f5c7b24706f386b68f9802f255" ON "match" ("created") ',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP INDEX "IDX_f5c7b24706f386b68f9802f255"');
		await queryRunner.query(
			'ALTER TABLE "match" RENAME COLUMN "ended" TO "matchEndTime"',
		);
		await queryRunner.query(
			'ALTER TABLE "match" RENAME COLUMN "updated" TO "lastMatchUpdateTime"',
		);
		await queryRunner.query(
			'ALTER TABLE "match" RENAME COLUMN "created" TO "matchStartTime"',
		);
		await queryRunner.query(
			'ALTER TABLE "match_slot" DROP COLUMN "updated"',
		);
		await queryRunner.query(
			'ALTER TABLE "match_slot" DROP COLUMN "created"',
		);
		await queryRunner.query(
			'ALTER TABLE "match_player" DROP COLUMN "rankTier"',
		);
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "updated"');
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "created"');
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "rankTier"');
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "discordName"');
		await queryRunner.query(
			'ALTER TABLE "user" RENAME COLUMN "twitchId" TO "twitch_id"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" RENAME COLUMN "twitchName" TO "twitch_name"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "profilePicture"',
		);
	}
}
