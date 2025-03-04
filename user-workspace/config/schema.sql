-- Master Data Table
CREATE TABLE IF NOT EXISTS master_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10) NOT NULL,
    region VARCHAR(50),
    county VARCHAR(50),
    email VARCHAR(100),
    source_filename VARCHAR(255) NOT NULL,
    vendor_name VARCHAR(100) NOT NULL,
    upload_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded Files Table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    vendor_name VARCHAR(100) NOT NULL,
    upload_date DATETIME NOT NULL,
    total_records INT NOT NULL,
    duplicate_count INT NOT NULL,
    status ENUM('processing', 'completed', 'failed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Download History Table
CREATE TABLE IF NOT EXISTS download_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    download_date DATETIME NOT NULL,
    record_count INT NOT NULL,
    filters JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_name VARCHAR(100) UNIQUE NOT NULL,
    total_data INT NOT NULL DEFAULT 0,
    remaining_data INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispositions Table
CREATE TABLE IF NOT EXISTS dispositions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(15) NOT NULL,
    disposition_status VARCHAR(50) NOT NULL,
    disposition_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone_number) REFERENCES master_data(phone_number)
);
