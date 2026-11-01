CREATE TABLE `album_highlights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scope` text NOT NULL,
	`year` integer NOT NULL,
	`slug` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `album_highlights_scope_slug` ON `album_highlights` (`scope`,`year`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_album_highlights_scope` ON `album_highlights` (`scope`,`sort_order`);--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`is_camp` integer DEFAULT false NOT NULL,
	`camp_key` text,
	`marking` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_calendar_events_date` ON `calendar_events` (`date`);--> statement-breakpoint
CREATE INDEX `idx_calendar_events_camp_key` ON `calendar_events` (`camp_key`);--> statement-breakpoint
CREATE TABLE `expo_push_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`platform` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_expo_push_tokens_updated_at` ON `expo_push_tokens` (`updated_at`);--> statement-breakpoint
CREATE TABLE `hyperlinks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year_group` text NOT NULL,
	`name` text NOT NULL,
	`href` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_hyperlinks_year_group` ON `hyperlinks` (`year_group`);--> statement-breakpoint
CREATE TABLE `notices` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`activity_type` text NOT NULL,
	`pdf_urls` text DEFAULT '[]' NOT NULL,
	`target` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notices_date` ON `notices` (`date`);--> statement-breakpoint
CREATE INDEX `idx_notices_activity_type` ON `notices` (`activity_type`);--> statement-breakpoint
CREATE TABLE `photo_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`years` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_photo_sections_sort` ON `photo_sections` (`sort_order`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`subscription` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verseOfDay` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`citation` text NOT NULL,
	`version` text NOT NULL,
	`passage` text NOT NULL,
	`image` text,
	`width` integer,
	`height` integer
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`year` integer NOT NULL,
	`playback_id` text NOT NULL,
	`thumbnail_time` real,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_videos_year` ON `videos` (`year`);--> statement-breakpoint
CREATE INDEX `idx_videos_sort` ON `videos` (`year`,`sort_order`,`created_at`);