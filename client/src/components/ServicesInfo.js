import React from 'react';
import './ServicesInfo.css';

const ServicesInfo = () => {
  const services = [
    { name: 'Frontend (React)', port: 3109 },
    { name: 'Backend (Express)', port: 5000 },
    { name: 'Database (PostgreSQL)', port: 5432 }
  ];

  return (
    <div className="info-box">
      <h3>Docker Services Running:</h3>
      <ul>
        {services.map((service, index) => (
          <li key={index}>
            ✅ {service.name} - Port {service.port}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServicesInfo;
