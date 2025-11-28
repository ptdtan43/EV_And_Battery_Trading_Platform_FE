import React, { useState } from 'react';
import { apiRequest } from '../lib/api';

export const ImageUploadTest = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testImageAPI = async () => {
    setLoading(true);
    setTestResult('Testing...');
    
    try {
      // Test 1: Check if ProductImage API is accessible
      console.log('🧪 Testing ProductImage API...');
      
      // Try to get images for product ID 7 (from your log)
      const testProductId = 7;
      console.log(`🧪 Testing with product ID: ${testProductId}`);
      
      const imagesData = await apiRequest(`/api/ProductImage/product/${testProductId}`);
      
      console.log('🧪 ProductImage API response:', imagesData);
      console.log('🧪 Response type:', typeof imagesData);
      console.log('🧪 Response is array:', Array.isArray(imagesData));
      console.log('🧪 Response length:', imagesData?.length || 'N/A');
      
      if (Array.isArray(imagesData)) {
        setTestResult(`✅ ProductImage API returned array with ${imagesData.length} items: ${JSON.stringify(imagesData)}`);
      } else if (imagesData && typeof imagesData === 'object') {
        setTestResult(`✅ ProductImage API returned object: ${JSON.stringify(imagesData)}`);
      } else {
        setTestResult(`⚠️ ProductImage API returned unexpected data type: ${typeof imagesData} - ${JSON.stringify(imagesData)}`);
      }
      
    } catch (error) {
      console.error('🧪 ProductImage API test failed:', error);
      setTestResult(`❌ ProductImage API test failed: ${error.message} (Status: ${error.status})`);
    } finally {
      setLoading(false);
    }
  };

  const testUploadAPI = async () => {
    setLoading(true);
    setTestResult('Testing upload...');
    
    try {
      console.log('🧪 Testing ProductImage upload API...');
      
      // Test the upload endpoint
      const testFormData = new FormData();
      testFormData.append('productId', '7');
      
      // Create a test image blob
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText('TEST', 20, 50);
      
      canvas.toBlob((blob) => {
        testFormData.append('imageFile', blob, 'test.png');
        
        apiRequest('/api/ProductImage', {
          method: 'POST',
          body: testFormData
        }).then(response => {
          console.log('🧪 Upload test response:', response);
          setTestResult(`✅ Upload test successful: ${JSON.stringify(response)}`);
          setLoading(false);
        }).catch(error => {
          console.error('🧪 Upload test failed:', error);
          setTestResult(`❌ Upload test failed: ${error.message} (Status: ${error.status})`);
          setLoading(false);
        });
      });
      
    } catch (error) {
      console.error('🧪 Upload test setup failed:', error);
      setTestResult(`❌ Upload test setup failed: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-blue-800 mb-2">
        🧪 Image Upload Test
      </h3>
      <div className="space-x-2">
        <button
          onClick={testImageAPI}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Get Images'}
        </button>
        <button
          onClick={testUploadAPI}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Upload'}
        </button>
      </div>
      {testResult && (
        <div className="mt-2 text-xs text-blue-700">
          {testResult}
        </div>
      )}
    </div>
  );
};
