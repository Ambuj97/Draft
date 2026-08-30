CREATE TABLE IF NOT EXISTS `beers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer,
	`name` text NOT NULL,
	`brewery` text,
	`abv` real,
	`price` real,
	`currency` text DEFAULT 'GBP',
	`venue` text,
	`photo_uri` text,
	`rating` integer,
	`notes` text,
	`latitude` real,
	`longitude` real,
	`logged_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`path_json` text DEFAULT '[]' NOT NULL,
	`distance` real DEFAULT 0,
	`is_live` integer DEFAULT true,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zone_id` text,
	`session_id` integer,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`author_id` text,
	`upvotes` integer DEFAULT 0,
	`downvotes` integer DEFAULT 0,
	`is_ephemeral` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
