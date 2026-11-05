ALTER TABLE `calendar_events` ADD `activity_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `start_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `end_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `gather_location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `dismiss_location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `fee` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `activity_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `participants` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `notice_id` text;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `has_pathfinder_pdf` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `has_adventurer_pdf` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `start_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `end_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `gather_location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `dismiss_location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `charged` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `fee` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `participants` text DEFAULT '[]' NOT NULL;