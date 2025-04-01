CREATE TABLE role {
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
};

CREATE TABLE account {
    account_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email LIKE '%@up.edu.ph'),
    role_id INT REFERENCES role (role_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
};

CREATE TABLE organization {
    organization_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    org_email VARCHAR(255) NOT NULL UNIQUE CHECK (email LIKE '%@gmail.com')
    description TEXT,
    adviser_name VARCHAR(255) NOT NULL,
    adviser_contact VARCHAR(255) NOT NULL
}

CREATE TABLE activity {
    activity_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES account(account_id) ON DELETE CASCADE,
    organization_id INT REFERENCES organization(organization_id) ON DELETE CASCADE,
    student_position VARCHAR(255),
    activity_name VARCHAR(255) NOT NULL,
    activity_description TEXT NOT NULL,
    category_id INT REFERENCES activity_category(category_id) ON DELETE CASCADE,
    sdg_goals TEXT NOT NULL,
    charge_fee BOOLEAN NOT NULL DEFAULT FALSE,
    university_partner BOOLEAN NOT NULL DEFAULT FALSE,
    partner_name TEXT NOT NULL,
    partner_role TEXT NOT NULL,
    venue VARCHAR(255) NOT NULL,
    venue_approver VARCHAR(255) NOT NULL,
    venue_approver_contact VARCHAR(255) NOT NULL,
    is_off_campus BOOLEAN NOT NULL DEFAULT FALSE,
    green_monitor_name VARCHAR(255) NOT NULL,
    green_monitor_contact VARCHAR(255) NOT NULL,
    drive_folder_id VARCHAR(255) NOT NULL UNIQUE,
    drive_folder_link TEXT, 
    sro_approval_status VARCHAR(50) DEFAULT 'Pending',
    odsa_approval_status VARCHAR(50) DEFAULT 'Pending',
    final_status VARCHAR(50) DEFAULT 'Pending',
    sro_remarks TEXT,
    odsa_remarks TEXT,
}

CREATE TABLE activity_schedule (
    schedule_id SERIAL PRIMARY KEY,
    activity_id INT REFERENCES activity(activity_id),
    is_recurring BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    recurring_days TEXT -- Comma-separated days (e.g., 'Wed,Fri')
);

CREATE TABLE change_request (
    request_id SERIAL PRIMARY KEY,
    activity_id INT REFERENCES activity(activity_id),
    submitted_by INT REFERENCES account(account_id),
    request_type VARCHAR(50), -- Change Schedule, Change Venue, Both, Cancellation
    new_start_date DATE,
    new_end_date DATE,
    new_start_time TIME,
    new_end_time TIME,
    new_venue VARCHAR(255),
    venue_approver_name VARCHAR(100),
    venue_approver_contact VARCHAR(100),
    submission_file_url TEXT,
    sro_approval_status VARCHAR(10) DEFAULT 'Pending',
    sro_remarks TEXT,
    submitted_at TIMESTAMP DEFAULT now()
);

CREATE TABLE org_annual_report (
    report_id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organization(organization_id),
    submitted_by INT REFERENCES account(account_id),
    academic_year VARCHAR(9), -- Format: YYYY-YYYY
    drive_folder_id VARCHAR(100) UNIQUE, -- Google Drive Folder ID
    submission_file_url TEXT, -- Direct link to uploaded PDF
    submitted_at TIMESTAMP DEFAULT now()
);


CREATE TABLE interview_slots (
    slot_id SERIAL PRIMARY KEY,
    academic_year VARCHAR(9), -- Format: YYYY-YYYY
    interview_date DATE, -- Available date set by SRO
    interview_time TIME, -- Available time set by SRO
    is_booked BOOLEAN DEFAULT FALSE -- True when booked
);


