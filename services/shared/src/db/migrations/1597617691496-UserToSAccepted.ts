import { MigrationInterface, QueryRunner } from "typeorm";

export class UserToSAccepted1597617691496 implements MigrationInterface {
	name = "UserToSAccepted1597617691496";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" ADD "tosAccepted" boolean NOT NULL DEFAULT false',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "tosAccepted"');
	}
}
