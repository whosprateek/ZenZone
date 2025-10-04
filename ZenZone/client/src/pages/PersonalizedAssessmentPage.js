import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalizedAssessment from '../components/PersonalizedAssessment';

const PersonalizedAssessmentPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <PersonalizedAssessment 
      isOpen={true} 
      onClose={handleClose} 
    />
  );
};

export default PersonalizedAssessmentPage;