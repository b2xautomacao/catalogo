
import React from 'react';

export const EditorTemplate = {
  id: 'editor',
  name: 'Editor',
  description: 'Template moderno baseado no design do editor visual',
  preview: 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600',
  colors: {
    primary: '#0057FF',
    secondary: '#FF6F00', 
    accent: '#8E2DE2',
    background: '#F8FAFC',
    text: '#1E293B',
    border: '#E2E8F0'
  },
  category: 'modern' as const,
  features: {
    gradient: true,
    modernCards: true,
    vibrantColors: true,
    responsiveDesign: true
  },
  styles: {
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 12,
    layoutSpacing: 20,
    buttonStyle: 'gradient',
    cardStyle: 'elevated',
    headerStyle: 'modern'
  }
};

export default EditorTemplate;
