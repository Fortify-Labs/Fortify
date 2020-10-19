import { MigrationInterface, QueryRunner } from "typeorm";

export class UserRatings1603126469995 implements MigrationInterface {
	name = "UserRatings1603126469995";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" ADD "standardRatingMmr" integer NOT NULL DEFAULT 0',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "standardRatingRank" integer NOT NULL DEFAULT 0',
		);
		await queryRunner.query(
			'ALTER TABLE "user" RENAME COLUMN "rankTier" TO "standardRatingRanktier"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "turboRatingMmr" integer NOT NULL DEFAULT 0',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "turboRatingRank" integer NOT NULL DEFAULT 0',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "turboRatingRanktier" integer',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "duosRatingMmr" integer NOT NULL DEFAULT 0',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "duosRatingRank" integer NOT NULL DEFAULT 0',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "duosRatingRanktier" integer',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "duosRatingRanktier"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "duosRatingRank"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "duosRatingMmr"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "turboRatingRank"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "turboRatingMmr"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "turboRatingRanktier"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "standardRatingRank"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "standardRatingMmr"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" RENAME COLUMN "standardRatingRanktier" TO "rankTier"',
		);
	}
}
