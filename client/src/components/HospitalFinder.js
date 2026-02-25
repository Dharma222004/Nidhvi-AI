import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function HospitalFinder({ hospitalsData, loading }) {
  const [activeTab, setActiveTab] = useState('both');

  if (loading) {
    return (
      <div className="hospital-finder-container loading">
        <div className="loading-content">
          <div className="spinner-ring"></div>
          <h4>Finding Nearby Hospitals & Doctors</h4>
          <p>Searching with Perplexity AI...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!hospitalsData || hospitalsData.error || !hospitalsData.results) {
    return (
      <div className="hospital-finder-container error-state">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <h4>Unable to Find Hospitals</h4>
          <p>{hospitalsData?.error || 'Hospital data not available. Please try again.'}</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const { location, results = [], specialistType, condition } = hospitalsData;

  // Filter results based on active tab
  const getFilteredHospitals = () => {
    if (activeTab === 'both') {
      return results;
    }
    return results.filter(r => r.type === activeTab);
  };

  const filteredResults = getFilteredHospitals();
  const totalHospitals = results.reduce((sum, r) => sum + (r.hospitals?.length || 0), 0);

  return (
    <div className="hospital-finder-container">
      {/* Header */}
      <div className="finder-header">
        <div className="header-icon">🏥</div>
        <div className="header-content">
          <h3>Recommended Hospitals & Doctors</h3>
          {location?.used && (
            <p className="location-badge">
              <span className="icon">📍</span>
              Near <strong>{location.used}</strong>
              {location.detected && <span className="detected-badge">Detected from report</span>}
            </p>
          )}
          {specialistType && condition && (
            <p className="search-info">
              Looking for <strong>{specialistType}</strong> for <strong>{condition}</strong>
            </p>
          )}
        </div>
        <div className="total-count">
          <span className="count-number">{totalHospitals}</span>
          <span className="count-label">Hospitals Found</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`tab ${activeTab === 'both' ? 'active' : ''}`}
          onClick={() => setActiveTab('both')}
        >
          <span className="tab-icon">🏥</span>
          <span>All Hospitals</span>
        </button>
        <button
          className={`tab ${activeTab === 'government' ? 'active' : ''}`}
          onClick={() => setActiveTab('government')}
        >
          <span className="tab-icon">🏛️</span>
          <span>Government</span>
        </button>
        <button
          className={`tab ${activeTab === 'private' ? 'active' : ''}`}
          onClick={() => setActiveTab('private')}
        >
          <span className="tab-icon">🏢</span>
          <span>Private</span>
        </button>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="results-container"
        >
          {filteredResults.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>No {activeTab === 'both' ? '' : activeTab} hospitals found in this area</p>
            </div>
          ) : (
            filteredResults.map((result, idx) => (
              <ResultSection key={idx} result={result} />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      <style jsx>{styles}</style>
    </div>
  );
}

function ResultSection({ result }) {
  const { type, hospitals = [] } = result;

  if (!hospitals || hospitals.length === 0) return null;

  return (
    <div className="result-section">
      <div className="section-header">
        <h4>
          <span className="type-icon">{type === 'government' ? '🏛️' : '🏢'}</span>
          {type === 'government' ? 'Government' : 'Private'} Hospitals
        </h4>
        <span className="hospital-count">{hospitals.length} found</span>
      </div>

      <div className="hospitals-grid">
        {hospitals.map((hospital, idx) => (
          <HospitalCard key={idx} hospital={hospital} index={idx} />
        ))}
      </div>

      <style jsx>{`
                .result-section {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                    border: 1px solid rgba(139, 92, 246, 0.15);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                }

                .section-header h4 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                }

                .type-icon {
                    font-size: 1.25rem;
                }

                .hospital-count {
                    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
                    color: white;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .hospitals-grid {
                    display: grid;
                    gap: 16px;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                }

                @media (max-width: 768px) {
                    .hospitals-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
    </div>
  );
}

function HospitalCard({ hospital, index }) {
  const {
    name,
    address,
    phone,
    doctors = [],
    specialties = [],
    rating,
    timing,
    consultationFee
  } = hospital;

  const handleCall = () => {
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      window.location.href = `tel:${cleanPhone}`;
    }
  };

  const handleDirections = () => {
    if (address) {
      const query = encodeURIComponent(`${name}, ${address}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="hospital-card"
    >
      {/* Card Header */}
      <div className="card-header">
        <h5 className="hospital-name">{name || 'Hospital'}</h5>
        {rating && (
          <div className="rating-badge">
            <span className="star">⭐</span>
            <span className="value">{rating}</span>
          </div>
        )}
      </div>

      {/* Address */}
      {address && (
        <div className="info-row address">
          <span className="info-icon">📍</span>
          <span className="info-text">{address}</span>
        </div>
      )}

      {/* Phone with Call Button */}
      {phone && (
        <div className="info-row phone-row">
          <div className="phone-info">
            <span className="info-icon">📞</span>
            <span className="info-text phone-number">{phone}</span>
          </div>
          <button className="call-now-btn" onClick={handleCall}>
            <span>📱</span>
            Call Now
          </button>
        </div>
      )}

      {/* Timing */}
      {timing && (
        <div className="info-row">
          <span className="info-icon">🕒</span>
          <span className="info-text">{timing}</span>
        </div>
      )}

      {/* Consultation Fee */}
      {consultationFee && (
        <div className="info-row">
          <span className="info-icon">💰</span>
          <span className="info-text">Consultation: <strong className="fee">{consultationFee}</strong></span>
        </div>
      )}

      {/* Doctors */}
      {doctors.length > 0 && (
        <div className="doctors-section">
          <p className="section-label">👨‍⚕️ Specialists:</p>
          <div className="doctors-list">
            {doctors.map((doctor, idx) => (
              <span key={idx} className="doctor-tag">{doctor}</span>
            ))}
          </div>
        </div>
      )}

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="specialties-section">
          {specialties.map((specialty, idx) => (
            <span key={idx} className="specialty-badge">{specialty}</span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="card-actions">
        {address && (
          <button className="action-btn directions" onClick={handleDirections}>
            <span>🗺️</span>
            Get Directions
          </button>
        )}
      </div>

      <style jsx>{`
                .hospital-card {
                    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 16px;
                    padding: 20px;
                    transition: all 0.3s ease;
                }

                .hospital-card:hover {
                    border-color: rgba(139, 92, 246, 0.4);
                    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15);
                    transform: translateY(-2px);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }

                .hospital-name {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin: 0;
                    flex: 1;
                    line-height: 1.3;
                }

                .rating-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-weight: 700;
                    color: #1e1b4b;
                    font-size: 0.85rem;
                }

                .info-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    margin: 10px 0;
                    font-size: 0.9rem;
                }

                .info-icon {
                    flex-shrink: 0;
                    font-size: 1rem;
                }

                .info-text {
                    color: #cbd5e1;
                    line-height: 1.4;
                }

                .phone-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(6, 182, 212, 0.1);
                    padding: 10px 12px;
                    border-radius: 10px;
                    border: 1px solid rgba(6, 182, 212, 0.2);
                }

                .phone-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .phone-number {
                    color: #06b6d4;
                    font-weight: 600;
                }

                .call-now-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .call-now-btn:hover {
                    background: linear-gradient(135deg, #34d399, #10b981);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    transform: scale(1.02);
                }

                .fee {
                    color: #10b981;
                    font-weight: 600;
                }

                .doctors-section {
                    margin: 16px 0;
                    padding: 12px;
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 10px;
                }

                .section-label {
                    font-size: 0.85rem;
                    color: #a78bfa;
                    font-weight: 600;
                    margin: 0 0 8px 0;
                }

                .doctors-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .doctor-tag {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    color: #e2e8f0;
                }

                .specialties-section {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin: 12px 0;
                }

                .specialty-badge {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2));
                    color: #67e8f9;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }

                .card-actions {
                    margin-top: 16px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(139, 92, 246, 0.1);
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    padding: 12px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .action-btn.directions {
                    background: transparent;
                    border: 2px solid rgba(139, 92, 246, 0.3);
                    color: #a78bfa;
                }

                .action-btn.directions:hover {
                    background: rgba(139, 92, 246, 0.15);
                    border-color: rgba(139, 92, 246, 0.5);
                }

                @media (max-width: 640px) {
                    .hospital-card {
                        padding: 16px;
                    }

                    .phone-row {
                        flex-direction: column;
                        gap: 10px;
                        align-items: flex-start;
                    }

                    .call-now-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
    </motion.div>
  );
}

// Main styles
const styles = `
    .hospital-finder-container {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
        border-radius: 20px;
        padding: 24px;
        border: 1px solid rgba(139, 92, 246, 0.2);
        margin-top: 16px;
    }

    .hospital-finder-container.loading,
    .hospital-finder-container.error-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
    }

    .loading-content,
    .error-content {
        text-align: center;
    }

    .loading-content h4,
    .error-content h4 {
        color: #f1f5f9;
        margin: 16px 0 8px;
        font-size: 1.1rem;
    }

    .loading-content p,
    .error-content p {
        color: #94a3b8;
        font-size: 0.9rem;
    }

    .spinner-ring {
        width: 50px;
        height: 50px;
        border: 3px solid rgba(139, 92, 246, 0.2);
        border-top-color: #a78bfa;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 8px;
    }

    .finder-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(139, 92, 246, 0.15);
    }

    .header-icon {
        font-size: 2.5rem;
        flex-shrink: 0;
    }

    .header-content {
        flex: 1;
    }

    .header-content h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 8px;
    }

    .location-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #94a3b8;
        font-size: 0.9rem;
        margin: 0 0 4px;
    }

    .location-badge strong {
        color: #06b6d4;
    }

    .detected-badge {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        margin-left: 6px;
    }

    .search-info {
        color: #64748b;
        font-size: 0.85rem;
        margin: 0;
    }

    .search-info strong {
        color: #a78bfa;
    }

    .total-count {
        text-align: center;
        padding: 12px 20px;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
        border-radius: 12px;
        border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .count-number {
        display: block;
        font-size: 1.75rem;
        font-weight: 700;
        color: #a78bfa;
    }

    .count-label {
        font-size: 0.75rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .filter-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        padding: 6px;
        background: rgba(15, 23, 42, 0.5);
        border-radius: 14px;
    }

    .tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
        border: none;
        background: transparent;
        color: #94a3b8;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        border-radius: 10px;
        transition: all 0.2s ease;
    }

    .tab:hover {
        background: rgba(139, 92, 246, 0.1);
        color: #c4b5fd;
    }

    .tab.active {
        background: linear-gradient(135deg, #8b5cf6, #06b6d4);
        color: white;
        font-weight: 600;
    }

    .tab-icon {
        font-size: 1.1rem;
    }

    .results-container {
        min-height: 200px;
    }

    .no-results {
        text-align: center;
        padding: 48px;
        color: #64748b;
    }

    .no-results-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 12px;
    }

    @media (max-width: 768px) {
        .hospital-finder-container {
            padding: 16px;
        }

        .finder-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .header-content h3 {
            font-size: 1.25rem;
        }

        .total-count {
            margin-top: 12px;
        }

        .filter-tabs {
            flex-wrap: wrap;
        }

        .tab {
            font-size: 0.85rem;
            padding: 10px 12px;
        }
    }
`;

export default HospitalFinder;
