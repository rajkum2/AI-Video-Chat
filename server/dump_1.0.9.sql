ALTER TABLE `lsv_rooms` ADD `video_ai_layout` tinyint(4) NOT NULL DEFAULT '0' AFTER `video_ai_gender`;
ALTER TABLE `lsv_rooms` ADD `video_ai_suggestions` VARCHAR(255) NULL AFTER `video_ai_layout`;
ALTER TABLE `lsv_rooms` ADD `datetime` VARCHAR(255) NULL AFTER `video_ai_suggestions`;
ALTER TABLE `lsv_rooms` ADD `duration` VARCHAR(255) NULL AFTER `datetime`;

ALTER TABLE `lsv_plans` CHANGE `interval` `interval` ENUM('N','H','D','W','M','Y') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL COMMENT 'N=Minutes (1 to many) H=Hours (1 to 24) D=Days (1 to 90) | W=Weeks (1 to 52) | M=Months (1 to 24) | Y=Years (1 to 5)';

ALTER TABLE `lsv_agents` ADD `date_expired` DATETIME NULL AFTER `recovery_token`;
ALTER TABLE `lsv_rooms` ADD `is_audio` TINYINT(4) NULL DEFAULT NULL AFTER `duration`;
ALTER TABLE `lsv_agents` ADD `elevenlabs_key` VARCHAR(256) NULL AFTER `payment_enabled`;