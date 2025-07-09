CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(500) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL,
    invoice_type VARCHAR(10) NOT NULL,
    items TEXT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    issued_at TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    pdf_url VARCHAR(1000),
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_event_id ON invoices(event_id);

-- Composite index for date range queries
CREATE INDEX idx_invoices_company_date ON invoices(company_id, issued_at); 