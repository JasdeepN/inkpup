'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Customer } from '@/lib/schemas/customer';

interface CustomerListPageProps {
  customers: Customer[];
}

export default function CustomerListPage({ customers }: CustomerListPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'deposits'>('recent');

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.phone && c.phone.includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'deposits':
        result.sort((a, b) => (b.total_deposits || 0) - (a.total_deposits || 0));
        break;
      case 'recent':
      default:
        // Already sorted by most recent from API
        break;
    }

    return result;
  }, [customers, searchQuery, sortBy]);

  return (
    <div className="customers-page">
      {/* Search and Filter Bar */}
      <div className="customers-toolbar">
        <div className="customers-search">
          <span className="customers-search__icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="customers-search__input"
          />
          {searchQuery && (
            <button
              type="button"
              className="customers-search__clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="customers-sort">
          <label htmlFor="sort" className="customers-sort__label">Sort:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="customers-sort__select"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name A-Z</option>
            <option value="deposits">Highest Deposits</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="customers-results">
          {filteredCustomers.length === 0 ? (
            <span>No customers match &quot;{searchQuery}&quot;</span>
          ) : (
            <span>
              Showing {filteredCustomers.length} of {customers.length} customers
            </span>
          )}
        </div>
      )}

      {/* Customer List */}
      {filteredCustomers.length === 0 && !searchQuery ? (
        <div className="customer-empty">
          <div className="customer-empty__icon">👥</div>
          <h3>No customers yet</h3>
          <p className="text-muted">
            Customers are automatically created when you link inquiries, or you can add them manually.
          </p>
          <Link href="/dashboard/customers/new" className="btn btn--primary mt-4">
            Add Your First Customer
          </Link>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="customer-empty--small">
          <p className="text-muted">No customers found matching your search.</p>
        </div>
      ) : (
        <div className="customer-list">
          {filteredCustomers.map((customer) => (
            <CustomerListItem key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerListItem({ customer }: { customer: Customer }) {
  const totalDeposits = customer.total_deposits || 0;
  const inquiryCount = customer.inquiry_count || 0;

  return (
    <Link href={`/dashboard/customers/${customer.id}`} className="customer-item">
      <div className="customer-item__main">
        <div className="customer-item__name">{customer.name}</div>
        <div className="customer-item__email">{customer.email}</div>
        {customer.phone && (
          <div className="customer-item__phone">{customer.phone}</div>
        )}
      </div>
      <div className="customer-item__stats">
        {totalDeposits > 0 && (
          <span className="customer-stat customer-stat--deposits">
            💰 ${totalDeposits.toFixed(2)}
          </span>
        )}
        {inquiryCount > 0 && (
          <span className="customer-stat customer-stat--inquiries">
            📬 {inquiryCount}
          </span>
        )}
      </div>
      <div className="customer-item__arrow">→</div>
    </Link>
  );
}
