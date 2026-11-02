CREATE TABLE `adventurer_honors` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name_zh` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`aliases` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`answer_source` text DEFAULT '' NOT NULL,
	`answer_source_note` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`requirements_md` text DEFAULT '' NOT NULL,
	`answers_md` text DEFAULT '' NOT NULL,
	`requirements_html` text DEFAULT '' NOT NULL,
	`answers_html` text DEFAULT '' NOT NULL,
	`badge_key` text DEFAULT '' NOT NULL,
	`badge_source` text DEFAULT '' NOT NULL,
	`has_docx` integer DEFAULT false NOT NULL,
	`has_zh_pdf` integer DEFAULT false NOT NULL,
	`has_en_pdf` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `adventurer_honors_code` ON `adventurer_honors` (`code`);