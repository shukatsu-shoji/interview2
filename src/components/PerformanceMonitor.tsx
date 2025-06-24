import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  errorCount: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  enabled = false // デフォルトを false に変更
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    apiResponseTime: 0,
    errorCount: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      // メモリ使用量の取得
      const memory = (performance as any).memory;
      const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;

      // レンダリング時間の測定
      const renderStart = performance.now();
      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart;
        
        setMetrics(prev => ({
          ...prev,
          renderTime: Math.round(renderTime * 100) / 100,
          memoryUsage
        }));
      });
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();

    return () => clearInterval(interval);
  }, [enabled]);

  // API レスポンス時間の監視
  useEffect(() => {
    if (!enabled) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const responseTime = performance.now() - start;
        
        setMetrics(prev => ({
          ...prev,
          apiResponseTime: Math.round(responseTime)
        }));
        
        return response;
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1
        }));
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* トグルボタン */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="パフォーマンス監視"
      >
        <Activity className="w-4 h-4" />
      </button>

      {/* メトリクス表示 */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg font-mono text-xs">
          <h3 className="font-bold mb-2 text-green-400">Performance Metrics</h3>
          <div className="space-y-1">
            <div>Render: {metrics.renderTime}ms</div>
            <div>Memory: {metrics.memoryUsage}MB</div>
            <div>API: {metrics.apiResponseTime}ms</div>
            <div>Errors: {metrics.errorCount}</div>
          </div>
        </div>
      )}
    </>
  );
};

// パフォーマンス測定用のカスタムフック
export const usePerformanceTracking = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
};