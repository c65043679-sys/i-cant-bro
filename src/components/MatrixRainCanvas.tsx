import React, { useEffect } from 'react';

export const MatrixRainCanvas: React.FC = () => {
  useEffect(() => {
    try {
      localStorage.setItem('nexus_matrix_rain', 'false');
    } catch (e) {}
  }, []);

  return null;
};


