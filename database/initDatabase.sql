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
    adviser_name VARCHAR(255),
    adviser_contact VARCHAR(255)
}