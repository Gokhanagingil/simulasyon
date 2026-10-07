CREATE TABLE `event_runs` (
	`workshop_id` text NOT NULL,
	`event_id` text NOT NULL,
	`released_at` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`workshop_id`, `event_id`),
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `simulation_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`workshop_id` text NOT NULL,
	`event_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`kind` text NOT NULL,
	`note` text NOT NULL,
	`choice_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `simulation_records` (
	`id` text PRIMARY KEY NOT NULL,
	`workshop_id` text NOT NULL,
	`event_id` text NOT NULL,
	`number` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`priority` text NOT NULL,
	`service_id` text NOT NULL,
	`ci_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`response_due_at` integer,
	`due_at` integer,
	`ack_at` integer,
	`resolved_at` integer,
	`assignee` text,
	`notes` text NOT NULL,
	`niles_url` text,
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action
);
