CREATE TABLE `assessment_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`userId` int NOT NULL,
	`participantRole` enum('facilitator','assessor','reviewer','executive_viewer') NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`version` varchar(20) NOT NULL DEFAULT '1.0',
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessment_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`templateId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`assessmentType` varchar(100) DEFAULT 'Energy Maturity',
	`status` enum('Draft','In-Progress','Under Review','Approved') NOT NULL DEFAULT 'Draft',
	`facilitatorUserId` int,
	`targetCompletionDate` timestamp,
	`approvedAt` timestamp,
	`approvedByUserId` int,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int,
	`organisationId` int,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`metadata` json,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `capabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domainId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`weight` float NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `capabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consensus_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`capabilityId` int NOT NULL,
	`facilitatorUserId` int NOT NULL,
	`consensusCurrentScore` int NOT NULL,
	`consensusTargetScore` int NOT NULL,
	`facilitatorNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consensus_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`weight` float NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`standardsAlignment` text,
	CONSTRAINT `domains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `level_descriptors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`capabilityId` int NOT NULL,
	`level` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`evidenceExamples` text,
	CONSTRAINT `level_descriptors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organisation_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`userId` int NOT NULL,
	`orgRole` enum('organisation_admin','facilitator','assessor','reviewer','executive_viewer') NOT NULL,
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `organisation_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organisations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`industry` varchar(100),
	`country` varchar(100),
	`logoUrl` text,
	`primaryContact` varchar(255),
	`primaryEmail` varchar(320),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `result_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`overallScore` float,
	`overallTargetScore` float,
	`domainScores` json,
	`capabilityScores` json,
	`highVarianceCapabilities` json,
	`emsMaturityLevel` int,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`calculatedByUserId` int,
	CONSTRAINT `result_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roadmap_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`capabilityId` int,
	`domainId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`horizon` enum('0-3 months','3-12 months','12-24 months','24+ months') NOT NULL,
	`priority` enum('Critical','High','Medium','Low') NOT NULL DEFAULT 'Medium',
	`priorityScore` float DEFAULT 0,
	`emsPackage` varchar(100),
	`status` enum('Pending','In Progress','Completed','Deferred') NOT NULL DEFAULT 'Pending',
	`assignedTo` varchar(255),
	`dueDate` timestamp,
	`isAutoGenerated` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roadmap_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `score_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`capabilityId` int NOT NULL,
	`userId` int NOT NULL,
	`currentScore` int,
	`targetScore` int,
	`confidence` enum('Low','Medium','High') DEFAULT 'Medium',
	`justification` text,
	`documentReference` text,
	`isDraft` boolean NOT NULL DEFAULT true,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `score_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `platformRole` enum('platform_owner','member') DEFAULT 'member' NOT NULL;