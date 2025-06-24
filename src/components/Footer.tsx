import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">就活商事　模擬面接</h3>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link 
              to="/terms" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              利用規約
            </Link>
            <Link 
              to="/privacy" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <span className="text-gray-600">
              お問い合わせ：
              <a 
                href="mailto:shukatsushoji@gmail.com" 
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                shukatsushoji@gmail.com
              </a>
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>&copy; 2025 就活商事くん. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};