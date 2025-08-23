-- Seed data for Blox Buddy database

-- Sample content items for curriculum
INSERT INTO content_items (module_id, week_id, day_id, title, youtube_video_id, duration, difficulty) VALUES
(1, 1, 1, 'Introduction to Roblox Studio', 'dQw4w9WgXcQ', 600, 'beginner'),
(1, 1, 2, 'Understanding the Interface', 'dQw4w9WgXcQ', 480, 'beginner'),
(1, 1, 3, 'Your First Part', 'dQw4w9WgXcQ', 720, 'beginner'),
(1, 1, 4, 'Properties and Attributes', 'dQw4w9WgXcQ', 540, 'beginner'),
(1, 1, 5, 'Week 1 Project', 'dQw4w9WgXcQ', 900, 'beginner');

-- Sample teams
INSERT INTO teams (name, description, leader_id, recruiting) VALUES
('Alpha Builders', 'A team focused on building amazing worlds', '00000000-0000-0000-0000-000000000001', true),
('Code Wizards', 'Masters of Lua scripting and game mechanics', '00000000-0000-0000-0000-000000000002', true),
('Design Dynasty', 'Creating beautiful and immersive experiences', '00000000-0000-0000-0000-000000000003', false);

-- Sample achievements
INSERT INTO achievements (name, description, icon, xp_reward, blox_reward) VALUES
('First Steps', 'Complete your first lesson', 'trophy', 10, 5),
('Week Warrior', 'Complete a full week of lessons', 'star', 50, 25),
('Module Master', 'Complete an entire module', 'crown', 200, 100),
('Team Player', 'Join your first team', 'users', 30, 15),
('Helper', 'Help another student', 'heart', 20, 10);