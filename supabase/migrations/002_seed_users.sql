-- ============================================
-- FIX: Seed Users dengan Destination ID yang Benar
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- Hapus data lama jika ada
DELETE FROM users;

-- Insert users untuk semua destinasi
-- PIN: 123456 (hashed dengan bcrypt)

-- Pantai Indah Kapuk
INSERT INTO users (destination_id, name, pin_hash, role)
SELECT id, 'Budi Petugas', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'petugas'
FROM destinations WHERE name = 'Pantai Indah Kapuk';

INSERT INTO users (destination_id, name, pin_hash, role)
SELECT id, 'Ani Koordinator', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'koordinator'
FROM destinations WHERE name = 'Pantai Indah Kapuk';

-- Taman Wisata Alam
INSERT INTO users (destination_id, name, pin_hash, role)
SELECT id, 'Citra Petugas', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'petugas'
FROM destinations WHERE name = 'Taman Wisata Alam';

INSERT INTO users (destination_id, name, pin_hash, role)
SELECT id, 'Dodi Koordinator', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'koordinator'
FROM destinations WHERE name = 'Taman Wisata Alam';

-- Air Terjun Curug
INSERT INTO users (destination_id, name, pin_hash, role)
SELECT id, 'Eka Petugas', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'petugas'
FROM destinations WHERE name = 'Air Terjun Curug';

INSERT INTO users (destination_id, name, pin_hash, role)
SELECT id, 'Fira Koordinator', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'koordinator'
FROM destinations WHERE name = 'Air Terjun Curug';

-- Admin (tanpa destinasi)
INSERT INTO users (destination_id, name, pin_hash, role)
VALUES (NULL, 'Admin Pusat', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'admin');

-- Update dengan PIN hash yang benar (123456)
UPDATE users SET pin_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqQ5sG2T5X8BIeX0HxXNCX.FNPfEy';

-- Verify
SELECT id, name, role, destination_id FROM users;
