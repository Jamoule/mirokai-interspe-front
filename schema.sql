-- ============================================================
-- SCHEMA BASE DE DONNÉES — PWA Mirokaï Experience
-- SQLite
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. ADMINS (utilisateurs back-office)
-- ────────────────────────────────────────────────────────────

CREATE TABLE admins (
    id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email             TEXT NOT NULL UNIQUE,
    password_hash     TEXT NOT NULL,
    display_name      TEXT,
    is_active         INTEGER DEFAULT 1,
    last_login_at     TEXT,
    created_at        TEXT DEFAULT (datetime('now')),
    updated_at        TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_admins_email ON admins(email);


-- ────────────────────────────────────────────────────────────
-- 2. PARCOURS SETTINGS (config globale du parcours)
-- ────────────────────────────────────────────────────────────

CREATE TABLE parcours_settings (
    id                          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    parcours_name               TEXT NOT NULL DEFAULT 'Mirokaï Experience',
    plan_image_url              TEXT,
    welcome_message             TEXT,
    completion_message          TEXT,
    satisfaction_email_template  TEXT,
    estimated_duration_min      INTEGER DEFAULT 35,
    is_active                   INTEGER DEFAULT 1,
    updated_at                  TEXT DEFAULT (datetime('now'))
);


-- ────────────────────────────────────────────────────────────
-- 3. MODULES (les stations du parcours)
-- ────────────────────────────────────────────────────────────

CREATE TABLE modules (
    id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    number            INTEGER NOT NULL UNIQUE,
    name              TEXT NOT NULL,
    description       TEXT,
    media_type        TEXT DEFAULT 'none' CHECK (media_type IN ('audio', 'video', 'none')),
    media_url         TEXT,
    image_urls        TEXT DEFAULT '[]',
    qr_code           TEXT UNIQUE,
    position_x        REAL DEFAULT 0,
    position_y        REAL DEFAULT 0,
    has_quiz          INTEGER DEFAULT 0,
    is_active         INTEGER DEFAULT 1,
    suggested_order   INTEGER,
    created_at        TEXT DEFAULT (datetime('now')),
    updated_at        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_modules_qr_code ON modules(qr_code);
CREATE INDEX idx_modules_is_active ON modules(is_active);


-- ────────────────────────────────────────────────────────────
-- 4. QUESTIONS (quiz par module et par tranche d'âge)
-- ────────────────────────────────────────────────────────────

CREATE TABLE questions (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    module_id       TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    age_group       TEXT NOT NULL CHECK (age_group IN ('3-4', '5-7', '8-10', 'parents')),
    question_text   TEXT NOT NULL,
    secret_word     TEXT,
    display_order   INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_questions_module_age ON questions(module_id, age_group);


-- ────────────────────────────────────────────────────────────
-- 5. ANSWERS (réponses possibles pour chaque question)
-- ────────────────────────────────────────────────────────────

CREATE TABLE answers (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    question_id     TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text     TEXT NOT NULL,
    is_correct      INTEGER DEFAULT 0,
    display_order   INTEGER DEFAULT 0
);

CREATE INDEX idx_answers_question ON answers(question_id);


-- ────────────────────────────────────────────────────────────
-- TRIGGERS — updated_at automatique
-- ────────────────────────────────────────────────────────────

CREATE TRIGGER trg_admins_updated_at
    AFTER UPDATE ON admins
    FOR EACH ROW
BEGIN
    UPDATE admins SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_modules_updated_at
    AFTER UPDATE ON modules
    FOR EACH ROW
BEGIN
    UPDATE modules SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_parcours_updated_at
    AFTER UPDATE ON parcours_settings
    FOR EACH ROW
BEGIN
    UPDATE parcours_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;


-- ────────────────────────────────────────────────────────────
-- DONNÉES D'EXEMPLE (seed)
-- ────────────────────────────────────────────────────────────

-- Admin par défaut (mot de passe : "enchanted2026" — à hasher côté NestJS avec bcrypt)
-- Le hash ci-dessous est un placeholder, le vrai hash sera généré au seed via NestJS
INSERT INTO admins (email, password_hash, display_name)
VALUES ('admin@enchanted.tools', '$2b$10$PLACEHOLDER_HASH_TO_REPLACE', 'Admin Enchanted Tools');

-- Config parcours
INSERT INTO parcours_settings (parcours_name, estimated_duration_min, welcome_message, completion_message)
VALUES (
    'Mirokaï Experience',
    35,
    'Bienvenue dans l''univers des Mirokaï ! Préparez-vous à vivre une aventure extraordinaire.',
    'Bravo ! Vous avez terminé l''Expérience Mirokaï. Récupérez votre badge collector et vos goodies !'
);

-- Modules
INSERT INTO modules (number, name, description, media_type, has_quiz, is_active, position_x, position_y, qr_code, suggested_order) VALUES
(1, 'La planète Nimira',         'Découvrez l''origine des Mirokaï et la magie du Mirium.',              'video', 1, 1, 15.5, 25.0, 'MOD-001', 1),
(2, 'Le Grimoire de Jérôme',     'Comment un rêveur a déchiffré le code pour contacter Nimira.',         'video', 1, 1, 35.0, 20.0, 'MOD-002', 2),
(3, 'L''atelier des Enchanteurs', 'Les coulisses de la création des combinaisons robotiques.',           'audio', 1, 1, 55.0, 30.0, 'MOD-003', 3),
(4, 'Miroki & Miroka',           'Rencontrez les jumeaux robots et apprenez à communiquer avec eux.',    'video', 1, 1, 75.0, 25.0, 'MOD-004', 4),
(5, 'Le Mirium sur Terre',       'Comment l''énergie créative se manifeste autour de nous.',             'audio', 0, 1, 50.0, 55.0, 'MOD-005', 5),
(6, 'Les missions des Mirokaï',  'Hôpitaux, écoles, aéroports : où les robots aident les humains.',     'video', 1, 1, 30.0, 60.0, 'MOD-006', 6);

-- Questions — Module 1 (La planète Nimira)
INSERT INTO questions (module_id, age_group, question_text, secret_word, display_order) VALUES
((SELECT id FROM modules WHERE number = 1), '3-4',     'De quelle couleur est le Mirium ?',                                      'ÉTOILE',  1),
((SELECT id FROM modules WHERE number = 1), '5-7',     'Comment s''appelle la planète où vivent les Mirokaï ?',                   'NIMIRA',  1),
((SELECT id FROM modules WHERE number = 1), '8-10',    'Quelle énergie les Mirokaï utilisent-ils pour voyager ?',                 'MIRIUM',  1),
((SELECT id FROM modules WHERE number = 1), 'parents', 'Quel est le principe technologique derrière la navigation de Miroki ?',   'LIDAR',   1);

-- Réponses — Question 3-4 ans (Module 1)
INSERT INTO answers (question_id, answer_text, is_correct, display_order) VALUES
((SELECT id FROM questions WHERE question_text = 'De quelle couleur est le Mirium ?'), 'Bleu',    0, 1),
((SELECT id FROM questions WHERE question_text = 'De quelle couleur est le Mirium ?'), 'Violet',  1, 2),
((SELECT id FROM questions WHERE question_text = 'De quelle couleur est le Mirium ?'), 'Rouge',   0, 3);

-- Réponses — Question 5-7 ans (Module 1)
INSERT INTO answers (question_id, answer_text, is_correct, display_order) VALUES
((SELECT id FROM questions WHERE question_text LIKE 'Comment s%appelle la planète%'), 'Nimira',  1, 1),
((SELECT id FROM questions WHERE question_text LIKE 'Comment s%appelle la planète%'), 'Pandora', 0, 2),
((SELECT id FROM questions WHERE question_text LIKE 'Comment s%appelle la planète%'), 'Mirania', 0, 3);

-- Réponses — Question 8-10 ans (Module 1)
INSERT INTO answers (question_id, answer_text, is_correct, display_order) VALUES
((SELECT id FROM questions WHERE question_text LIKE 'Quelle énergie%'), 'Le Mirium',       1, 1),
((SELECT id FROM questions WHERE question_text LIKE 'Quelle énergie%'), 'L''électricité',  0, 2),
((SELECT id FROM questions WHERE question_text LIKE 'Quelle énergie%'), 'Le soleil',       0, 3),
((SELECT id FROM questions WHERE question_text LIKE 'Quelle énergie%'), 'La gravité',      0, 4);

-- Réponses — Question parents (Module 1)
INSERT INTO answers (question_id, answer_text, is_correct, display_order) VALUES
((SELECT id FROM questions WHERE question_text LIKE 'Quel est le principe technologique%'), 'LIDAR',                   1, 1),
((SELECT id FROM questions WHERE question_text LIKE 'Quel est le principe technologique%'), 'GPS indoor',              0, 2),
((SELECT id FROM questions WHERE question_text LIKE 'Quel est le principe technologique%'), 'Reconnaissance visuelle', 0, 3);