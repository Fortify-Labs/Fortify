import { MigrationInterface, QueryRunner } from "typeorm";

export class UserSuspension1597616124879 implements MigrationInterface {
	name = "UserSuspension1597616124879";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" ADD "suspended" boolean NOT NULL DEFAULT false',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "suspended"');
	}
}
