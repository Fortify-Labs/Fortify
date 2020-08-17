import { MigrationInterface, QueryRunner } from "typeorm";

export class PublicPlayerProfiles1597621709001 implements MigrationInterface {
	name = "PublicPlayerProfiles1597621709001";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" ADD "publicProfile" boolean NOT NULL DEFAULT false',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "publicProfile"',
		);
	}
}
