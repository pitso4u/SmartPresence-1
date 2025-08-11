-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_name TEXT NOT NULL,
    school_address TEXT NOT NULL,
    school_logo_url TEXT,
    school_slogan TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    attendance_start_time TEXT NOT NULL,
    attendance_end_time TEXT NOT NULL,
    late_threshold_minutes INTEGER DEFAULT 15,
    enable_dark_mode BOOLEAN DEFAULT 0,
    card_design TEXT NOT NULL DEFAULT '{"primaryColor":"#3b82f6","secondaryColor":"#f3f4f6","showSchoolLogo":true,"showStudentPhoto":true,"showQrCode":true,"showSlogan":true,"showReturnInfo":true,"cardWidth":"85.6","cardHeight":"54","borderRadius":"8"}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
